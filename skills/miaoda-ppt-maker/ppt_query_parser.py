#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PPT意图理解与调用模块 V1.0

处理用户用自然语言请求生成PPT的场景

【支持的用户query类型】

1. 直接请求型：
   - "做个PPT"
   - "做份演示"
   - "生成一个汇报"

2. 带主题型：
   - "做个产品调研的PPT"
   - "做一个竞品分析的汇报"
   - "生成xx产品的介绍材料"

3. 带内容型：
   - "把这段文字做成PPT" + 附带内容
   - "这些内容做成演示" + 附带内容

4. 转换型：
   - "调研报告做成PPT"
   - "分析结果做成演示文稿"

5. 场景型：
   - "做个周报"
   - "做个述职汇报"
   - "年终总结PPT"

【处理流程】

用户query → 意图识别 → 信息提取 → 执行决策

意图类型：
- INTENT_DIRECT: 直接生成（已有内容）
- INTENT_NEED_CONTENT: 需要提供内容
- INTENT_NEED_THEME: 需要确认主题
- INTENT_WRAP_CONTENT: 包装现有内容
"""

import re
from typing import Dict, Any, Optional, List
from enum import Enum


class PPTIntent(Enum):
    """PPT生成意图类型"""
    DIRECT = "direct"              # 直接生成（有内容）
    NEED_CONTENT = "need_content"  # 需要提供内容
    NEED_THEME = "need_theme"     # 需要确认主题
    WRAP_CONTENT = "wrap_content" # 包装现有内容
    UNKNOWN = "unknown"            # 未知


class PPTQueryParser:
    """PPT查询解析器"""
    
    # 触发词模式
    TRIGGER_PATTERNS = [
        # 英文
        r'\b(做|做个|做一个)\s*(个?\s*)?PPT\b',
        r'\b(做|做个|做一个)\s*(个?\s*)?演示\b',
        r'\b(做|做个|做一个)\s*(个?\s*)?汇报\b',
        r'\b(做|做个|做一个)\s*(个?\s*)?(报告|介绍|总结)\b',
        r'\b(生成|制作|创建)\s*(一个?\s*)?(PPT|演示|汇报)\b',
        r'\b(做成|做成PPT|做成演示)\b',
        r'\b把.*\s*(做成|做成PPT|做成演示)\b',
        
        # 中文
        r'做个?\w*(PPT|演示|汇报|报告)',
        r'生成\w*(PPT|演示|汇报)',
        r'\w*(做成|做成PPT)\w*',
    ]
    
    # 内容引用模式
    CONTENT_PATTERNS = [
        r'这段?\w*内容',
        r'这段?\w*文字',
        r'这个?\w*分析',
        r'这个?\w*调研',
        r'这个?\w*报告',
        r'上面?\w*说的',
        r'前面?\w*提到的',
    ]
    
    # 场景词（这些词本身就构成完整意图）
    SCENE_KEYWORDS = {
        '周报': ['周报', 'weekly', '周工作总结'],
        '月报': ['月报', 'monthly', '月工作总结'],
        '季报': ['季报', 'quarterly'],
        '年报': ['年报', '年终', '年度总结', '年终总结'],
        '述职': ['述职', '述职报告'],
        '调研报告': ['调研', '调研报告', '调查报告'],
        '竞品分析': ['竞品', '竞品分析', '竞争分析'],
        '产品介绍': ['产品介绍', '产品PPT', '产品文档'],
        '解决方案': ['方案', '解决方案', '解决思路'],
        '技术分享': ['分享', '技术分享', '经验分享'],
        '培训材料': ['培训', '培训材料', '教学'],
    }
    
    # 完整的触发模式（场景词 + PPT相关词）
    COMPLETE_INTENT_PATTERNS = [
        r'做个?\w*(?:周报|月报|季报|年报|述职|调研|分析)?\s*(?:PPT|演示|汇报|报告)?',
        r'做?个?\w*(?:调研|分析|报告|介绍|总结)(?:的\s*)?(?:PPT|汇报|演示)?',
        r'生成\w*(?:PPT|演示|汇报)',
        r'制作\w*(?:PPT|演示|汇报)',
        r'创建\w*(?:PPT|演示|汇报)',
        r'\w*做成\w*(?:PPT|演示)',
    ]
    
    # 主题提取词（按优先级排序）
    THEME_PATTERNS = [
        # 场景+主题："做个xx调研的PPT" → "xx调研"
        (r'(?:做|做?个|做个)\s*(.+?)\s*(?:调研|分析|报告|介绍|总结)\s*(?:的\s*)?(?:PPT|汇报|演示)?', 1),
        # "xx调研PPT" → "xx调研"
        (r'(.+?)\s*(?:调研|分析|报告|介绍|总结)\s*(?:PPT|汇报|演示)?', 1),
        # "xx的PPT" → "xx"
        (r'(.+?)\s*(?:的)\s*(?:PPT|汇报|演示)', 1),
        # "关于xx" → "xx"
        (r'(?:关于|有关|针对)\s*(.+?)(?:\s*$|\s*[的])', 1),
    ]
    
    def __init__(self):
        self.trigger_re = [re.compile(p, re.IGNORECASE) for p in self.TRIGGER_PATTERNS]
        self.content_re = [re.compile(p) for p in self.CONTENT_PATTERNS]
        
    def parse(self, query: str) -> Dict[str, Any]:
        """解析用户query
        
        Args:
            query: 用户原始query
        
        Returns:
            解析结果 {
                "intent": PPTIntent,
                "has_trigger": bool,
                "has_content_reference": bool,
                "theme": str,
                "scene": str,
                "suggestions": list,
                "original_query": str
            }
        """
        query = query.strip()
        
        # 1. 检测是否有触发词
        has_trigger = self._has_trigger(query)
        
        # 2. 检测是否引用了现有内容
        has_content_ref = self._has_content_reference(query)
        
        # 3. 提取主题
        theme = self._extract_theme(query)
        
        # 4. 识别场景
        scene = self._identify_scene(query)
        
        # 5. 判断意图
        intent = self._determine_intent(
            has_trigger, has_content_ref, theme, query
        )
        
        # 6. 生成建议
        suggestions = self._generate_suggestions(intent, theme, scene, query)
        
        return {
            "intent": intent,
            "has_trigger": has_trigger,
            "has_content_reference": has_content_ref,
            "theme": theme,
            "scene": scene,
            "suggestions": suggestions,
            "original_query": query
        }
    
    def _has_trigger(self, query: str) -> bool:
        """检测是否包含PPT触发词"""
        # 完整意图模式
        for pattern in self.COMPLETE_INTENT_PATTERNS:
            if re.search(pattern, query, re.IGNORECASE):
                return True
        return False
    
    def _has_content_reference(self, query: str) -> bool:
        """检测是否引用了现有内容"""
        for pattern in self.content_re:
            if pattern.search(query):
                return True
        return False
    
    def _extract_theme(self, query: str) -> Optional[str]:
        """提取PPT主题"""
        query_lower = query.lower()
        
        # 预处理：移除常见前缀
        clean_query = re.sub(r'^(?:帮我|请|帮我做|做个?|生成|制作|创建)\s*', '', query_lower)
        
        # 场景关键词（优先匹配更长的）
        scene_keywords_flat = []
        for scene_name, keywords in self.SCENE_KEYWORDS.items():
            for kw in keywords:
                scene_keywords_flat.append((len(kw), kw, scene_name))
        # 按长度降序
        scene_keywords_flat.sort(key=lambda x: x[0], reverse=True)
        
        # 尝试在清理后的query中匹配场景关键词
        for _, kw, scene_name in scene_keywords_flat:
            if kw in clean_query:
                # 提取kw的位置
                idx = clean_query.find(kw)
                before = clean_query[:idx].strip()
                # 清理"一个"、"做个"等
                before = before.replace("一个", "").replace("做个", "").replace("个", "").replace("份", "").strip()
                # 如果有意义（>1个字），返回；否则返回场景名
                if len(before) > 1:
                    return before
                return scene_name
        
        # 尝试模式匹配
        for pattern, group_idx in self.THEME_PATTERNS:
            match = re.search(pattern, query, re.IGNORECASE)
            if match and match.group(group_idx):
                theme = match.group(group_idx).strip()
                # 清理
                theme = theme.replace("一个", "").replace("做个", "").replace("个", "").replace("份", "").strip()
                if len(theme) > 1:
                    return theme
        
        # 如果什么都没匹配到，返回清理后的query（如果是独立意图）
        if clean_query and len(clean_query) > 2:
            return clean_query
        
        return None
    
    def _identify_scene(self, query: str) -> Optional[str]:
        """识别场景类型"""
        query_lower = query.lower()
        
        for scene_name, keywords in self.SCENE_KEYWORDS.items():
            for kw in keywords:
                if kw in query_lower:
                    return scene_name
        
        return None
    
    def _determine_intent(
        self,
        has_trigger: bool,
        has_content_ref: bool,
        theme: Optional[str],
        query: str
    ) -> PPTIntent:
        """判断用户意图"""
        if not has_trigger:
            return PPTIntent.UNKNOWN
        
        # 引用了现有内容
        if has_content_ref:
            return PPTIntent.WRAP_CONTENT
        
        # 有明确主题或场景
        if theme:
            return PPTIntent.DIRECT
        
        # 检查是否是纯场景词（如"做个周报"）
        query_lower = query.strip().lower()
        for scene_name, keywords in self.SCENE_KEYWORDS.items():
            for kw in keywords:
                if query_lower == kw or query_lower.startswith(kw):
                    return PPTIntent.DIRECT
        
        # 需要确认主题
        return PPTIntent.NEED_THEME
    
    def _generate_suggestions(
        self,
        intent: PPTIntent,
        theme: Optional[str],
        scene: Optional[str],
        query: str
    ) -> List[str]:
        """生成建议"""
        suggestions = []
        
        if intent == PPTIntent.DIRECT:
            suggestions.append(f"请提供「{theme}」的具体内容，我将为您制作PPT")
            if scene:
                suggestions.append(f"提示：这是一个{scene}类型的汇报")
        
        elif intent == PPTIntent.WRAP_CONTENT:
            suggestions.append("好的，我会将您提供的内容制作成PPT")
        
        elif intent == PPTIntent.NEED_THEME:
            suggestions.append("请告诉我PPT的主题，例如：「做个产品调研的PPT」")
            suggestions.append("或者直接粘贴要制作成PPT的内容")
        
        elif intent == PPTIntent.UNKNOWN:
            suggestions.append("我好像没有理解您的意思")
            suggestions.append("您可以说「做个PPT」或「把内容做成演示」")
        
        return suggestions


# ══════════════════════════════════════════════════════════════
# PPT执行器
# ══════════════════════════════════════════════════════════════

class PPTExecutor:
    """PPT执行器"""
    
    def __init__(self):
        self.parser = PPTQueryParser()
    
    def execute(self, query: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """执行PPT生成请求
        
        Args:
            query: 用户query
            context: 上下文（可能包含content等）
        
        Returns:
            执行结果
        """
        context = context or {}
        
        # 1. 解析意图
        parsed = self.parser.parse(query)
        
        # 2. 根据意图执行
        if parsed["intent"] == PPTIntent.DIRECT:
            return self._handle_direct(parsed, context)
        elif parsed["intent"] == PPTIntent.WRAP_CONTENT:
            return self._handle_wrap_content(parsed, context)
        elif parsed["intent"] == PPTIntent.NEED_THEME:
            return self._handle_need_theme(parsed)
        else:
            return self._handle_unknown(parsed)
    
    def _handle_direct(
        self,
        parsed: Dict,
        context: Dict
    ) -> Dict[str, Any]:
        """处理直接请求"""
        # 检查context中是否有内容
        content = context.get("content")
        theme = parsed.get("theme") or context.get("title")
        
        if content:
            # 有内容，直接生成
            return {
                "action": "generate",
                "need_input": False,
                "content": content,
                "title": theme,
                "scene": parsed.get("scene"),
                "message": f"正在为您制作「{theme or 'PPT'}」，请稍候..."
            }
        else:
            # 需要用户提供内容
            return {
                "action": "ask_content",
                "need_input": True,
                "title": theme,
                "message": f"请提供「{theme or '这个主题'}」的具体内容",
                "suggestions": [
                    "您可以直接粘贴内容",
                    "也可以描述主要内容"
                ]
            }
    
    def _handle_wrap_content(
        self,
        parsed: Dict,
        context: Dict
    ) -> Dict[str, Any]:
        """处理包装现有内容"""
        content = context.get("content")
        
        if content:
            return {
                "action": "generate",
                "need_input": False,
                "content": content,
                "title": parsed.get("theme") or context.get("title"),
                "scene": parsed.get("scene"),
                "message": "正在将内容制作成PPT..."
            }
        else:
            return {
                "action": "ask_content",
                "need_input": True,
                "message": "请提供要制作成PPT的具体内容",
                "suggestions": ["直接粘贴内容即可"]
            }
    
    def _handle_need_theme(
        self,
        parsed: Dict
    ) -> Dict[str, Any]:
        """处理需要确认主题"""
        return {
            "action": "ask_theme",
            "need_input": True,
            "message": "请告诉我PPT的主题",
            "suggestions": parsed.get("suggestions", []),
            "examples": [
                "做个产品调研的PPT",
                "做个竞品分析的汇报",
                "做个周报"
            ]
        }
    
    def _handle_unknown(
        self,
        parsed: Dict
    ) -> Dict[str, Any]:
        """处理未知意图"""
        return {
            "action": "clarify",
            "need_input": True,
            "message": "我没有理解您的意思",
            "suggestions": [
                "可以说「做个PPT」",
                "可以说「把内容做成演示」",
                "可以说「做个xx调研的汇报」"
            ]
        }


# ══════════════════════════════════════════════════════════════
# 便捷函数
# ══════════════════════════════════════════════════════════════

_executor = PPTExecutor()

def parse_ppt_query(query: str, context: Dict = None) -> Dict[str, Any]:
    """解析PPT相关query"""
    return _executor.execute(query, context)


def is_ppt_intent(query: str) -> bool:
    """判断是否是PPT相关意图"""
    parser = PPTQueryParser()
    parsed = parser.parse(query)
    return parsed.get("has_trigger", False)


# ══════════════════════════════════════════════════════════════
# 测试
# ══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    executor = PPTExecutor()
    
    test_queries = [
        "做个PPT",
        "做个产品调研的PPT",
        "把这段文字做成演示",
        "做个周报",
        "帮我做一个竞品分析的汇报",
        "生成一个年终总结",
        "这个调研报告做成PPT",
        "hello",
    ]
    
    print("=" * 70)
    print("PPT意图解析测试")
    print("=" * 70)
    
    for query in test_queries:
        result = executor.execute(query)
        print(f"\n❓ 「{query}」")
        print(f"   意图: {result.get('action')}")
        print(f"   主题: {result.get('title', '无')}")
        print(f"   场景: {result.get('scene', '无')}")
        print(f"   消息: {result.get('message', '')[:50]}...")
