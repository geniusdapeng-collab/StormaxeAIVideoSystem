#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ImagePromptAgent V4.9.5 - 配图提示词专家（智能通用版）
2026-04-11

【V4.9.5 核心改进】
1. 茶道场景根据页面标题精确匹配（不再所有页面用同一个prompt）
2. 新增 tea_ceremony 内容分类
3. 新增 lifestyle 内容分类
4. 强制统一写实摄影风格
"""

from typing import Dict, List, Any, Optional


PHOTOREALISTIC_SUFFIX = (
    ", photorealistic style, professional photography, "
    "natural lighting, realistic details, "
    "shot on DSLR camera, high resolution, "
    "16:9 aspect ratio, "
    "no illustration, no cartoon, no anime, no drawing, "
    "no watercolor, no vector art, no 3D render"
)

SCENE_TEMPLATES = {
    "cover": {
        "scene": "beautiful scenic landscape representing the main theme, professional wide-angle photography, stunning composition with depth and atmosphere",
        "position_hint": "wide panoramic composition, epic view, ",
    },
    "section": {
        "scene": "thematic visual representing the section topic, professional photography, clean composition, balanced visual elements with negative space for text",
        "position_hint": "balanced composition, clean layout, ",
    },
    "closing": {
        "scene": "warm closing visual representing completion and gratitude, golden hour photography, emotional atmosphere, peaceful and satisfying visual",
        "position_hint": "warm emotional composition, golden hour lighting, ",
    },
}

CONTENT_CATEGORIES = {
    "tea_ceremony": {
        "keywords": ["茶", "泡茶", "盖碗", "紫砂壶", "壶承", "水盂", "公道杯", "品茗", "茶席", "茶道", "茶具", "干泡", "湿泡", "洗茶", "润茶", "出汤", "分茶", "温壶", "置茶", "tea", "teapot", "teacup"],
    },
    "travel_nature": {
        "keywords": ["旅行", "旅游", "出游", "目的地", "景点", "风景", "山", "湖", "海", "森林", "自然", "户外", "自驾", "行程", "mountain", "lake", "forest"],
    },
    "family_life": {
        "keywords": ["家庭", "家人", "爸爸", "妈妈", "宝宝", "孩子", "亲子", "育儿", "爷爷", "奶奶"],
    },
    "health_wellness": {
        "keywords": ["健康", "运动", "健身", "养生", "饮食", "营养", "医疗", "护理", "安全"],
    },
    "food_dining": {
        "keywords": ["美食", "餐饮", "餐厅", "菜", "晚餐", "午餐", "农家乐", "特色菜"],
    },
    "preparation_items": {
        "keywords": ["准备", "清单", "行李", "用品", "装备", "推荐", "套装", "入门", "packing", "checklist"],
    },
    "budget_finance": {
        "keywords": ["预算", "费用", "花费", "价格", "成本", "金钱", "财务", "经济"],
    },
    "weather_season": {
        "keywords": ["天气", "预报", "雨", "晴", "温度", "季节", "weather", "rain", "sun"],
    },
    "education_learning": {
        "keywords": ["学习", "培训", "课程", "教育", "知识", "学校", "老师", "学生"],
    },
    "technology_innovation": {
        "keywords": ["技术", "科技", "创新", "研发", "产品", "AI", "数据", "软件", "算法"],
    },
    "business_work": {
        "keywords": ["汇报", "总结", "计划", "方案", "项目", "团队", "业绩", "季度", "年度", "KPI"],
    },
    "lifestyle": {
        "keywords": ["生活", "日常", "习惯", "心得", "感悟", "tips", "建议", "贴士", "美学", "心境", "修养"],
    },
    "steps_process": {
        "keywords": ["step", "步骤", "流程", "方法", "温壶", "置茶", "洗茶", "泡茶", "分茶", "前期"],
    },
}


class ImagePromptAgent:
    def __init__(self, topic: str = "", style: str = "photorealistic", scene: str = None):
        self.topic = topic
        self.style = style
        self.scene = scene
    
    def _detect_category(self, slide: Dict) -> str:
        title = slide.get('title', '') or slide.get('main', '') or ''
        items_text = ' '.join([str(i.get('title', '')) + ' ' + str(i.get('value', '')) for i in slide.get('items', [])])
        
        # 优先标题
        for cat_name, cat_info in CONTENT_CATEGORIES.items():
            if any(kw.lower() in title.lower() for kw in cat_info['keywords']):
                return cat_name
        # 其次items
        for cat_name, cat_info in CONTENT_CATEGORIES.items():
            if any(kw.lower() in items_text.lower() for kw in cat_info['keywords']):
                return cat_name
        # 最后bottom_text
        bottom = slide.get('bottom_text', '').lower()
        for cat_name, cat_info in CONTENT_CATEGORIES.items():
            if any(kw.lower() in bottom for kw in cat_info['keywords']):
                return cat_name
        return None
    
    def _get_tea_scene(self, title: str) -> str:
        """根据页面标题生成茶道专用场景描述"""
        if not title:
            return "elegant Chinese tea ceremony scene, traditional teaware, professional photography"
        
        # 泡茶步骤
        if '温壶' in title or '温杯' in title:
            return "hot water being poured from kettle into Chinese teapot, steam rising, warming up the vessel, close-up action shot, warm lighting"
        if '置茶' in title:
            return "dried tea leaves being placed into white porcelain gaiwan with bamboo tea scoop, close-up of tea leaf texture, warm natural lighting"
        if '洗茶' in title or '润茶' in title:
            return "hot water being poured over tea leaves in gaiwan, first rinse, steam rising, tea leaves starting to unfurl, close-up action photography"
        if '正式泡茶' in title or 'Step4' in title:
            return "golden amber tea liquor being poured from gaiwan into glass fairness pitcher, beautiful tea stream, steam rising, dramatic backlight"
        if '分茶' in title or '品饮' in title or 'Step5' in title:
            return "tea being poured from glass fairness pitcher into small white tasting cups, golden tea liquor visible, elegant hand movement"
        
        # 茶具
        if '壶承' in title:
            return "close-up of Chinese bamboo tea tray on wooden table, elegant minimalist design, single teapot resting on it, shallow depth of field"
        if '水盂' in title or '废水' in title:
            return "Chinese ceramic water bowl on clean tea table, minimalist design, soft natural lighting, zen atmosphere, product photography"
        if '紫砂壶' in title or '盖碗' in title:
            return "Chinese purple clay teapot and white porcelain gaiwan side by side, comparison shot on wooden surface, warm ambient lighting"
        if '辅助茶具' in title or '茶巾' in title:
            return "Chinese tea ceremony accessories on wooden surface: bamboo tea tongs, tea scoop, linen tea towel, small flower vase"
        if '茶具清单' in title:
            return "complete Chinese tea ceremony tools laid out on bamboo mat overhead view: gaiwan, fairness pitcher, four cups, tea tray, water bowl"
        
        # 茶席
        if '茶席构成' in title or '构成要素' in title:
            return "complete Chinese tea table setup from above: teapot centered, fairness pitcher and water bowl at 45-degree angle, four cups in a row"
        if '茶席美学' in title or '美学原则' in title:
            return "minimalist Chinese tea table arrangement with generous white space, single teapot, two cups, one small flower, soft natural light"
        if '茶席布置' in title or '场景' in title:
            return "Chinese tea setup in different environments: office desk, living room table, outdoor portable set, natural lighting"
        
        # 干泡法概念 - 按精确度排序，最具体的放前面
        if '干泡法' in title or '干泡' in title:
            if 'vs' in title or '湿泡' in title or '对比' in title:
                return "Chinese dry brewing tea setup vs wet brewing with large tea tray, comparison shot, clean vs water-covered surface, overhead photography"
            if '什么是' in title or '定义' in title:
                return "clean dry Chinese tea table setup: teapot, cups, small water bowl, no large drainage tray, minimalist aesthetic, zen atmosphere"
            if '精神' in title or '内涵' in title:
                return "serene tea meditation moment: single steaming teacup on clean wooden table, soft light, minimal composition, zen contemplative mood"
            if '控水' in title or '技巧' in title:
                return "precise water pouring technique: steady hand holding kettle, thin controlled water stream into teapot, close-up detail, dramatic lighting"
            if '清洁' in title or '维护' in title:
                return "hands wiping tea table with clean linen cloth, teaware being cared for, warm natural lighting, attention to detail"
            if '心境' in title or '修养' in title:
                return "person sitting quietly at tea table, hands gently holding warm teacup, soft morning light, contemplative mood"
            if '心得' in title:
                return "personal tea moment at wooden desk: notebook, pen, and steaming teacup, warm desk lamp light, cozy atmosphere"
            if '总结' in title or '要点' in title or '核心' in title:
                return "elegant summary of Chinese tea elements: teapot, cups, tea leaves, water bowl arranged in clean composition on wooden surface"
            if '茶叶' in title or '茶类' in title:
                return "variety of Chinese tea leaves in small ceramic bowls: green tea, black tea, oolong, pu-erh, colorful comparison, overhead shot"
            if '推荐' in title or '套装' in title or '入门' in title:
                return "beginner Chinese tea ceremony starter set: gaiwan, glass fairness pitcher, four white cups, bamboo tea tray, product photography"
        
        # 茶叶/茶类（独立于干泡法）
        if '茶叶' in title or '茶类' in title or '泡法' in title:
            return "variety of Chinese tea leaves in small ceramic bowls: green tea, black tea, oolong, pu-erh, white tea, colorful comparison, overhead shot"
        
        # 准备
        if '准备' in title or '前期' in title:
            return "tea ceremony preparation: electric kettle boiling, teaware arranged on clean table, tea leaves in caddy, natural daylight"
        
        # 推荐/套装
        if '推荐' in title or '套装' in title or '入门' in title:
            return "beginner Chinese tea ceremony starter set: gaiwan, glass fairness pitcher, four white cups, bamboo tea tray, product photography"
        
        # 清洁/维护
        if '清洁' in title or '维护' in title:
            return "hands wiping tea table with clean linen cloth, teaware being cared for, warm natural lighting, attention to detail"
        
        # 泡茶心得/经验
        if '泡茶' in title or '心得' in title or '经验' in title:
            return "personal tea moment at wooden desk: notebook, pen, and steaming teacup, warm desk lamp light, cozy atmosphere"
        
        # 默认
        return "elegant Chinese tea ceremony scene, traditional teaware including teapot and teacups on wooden surface, steaming hot tea, warm natural lighting"
    
    def generate_prompt(self, slide: Dict, idx: int, total_pages: int = 0) -> str:
        slide_type = slide.get('type', '')
        title = slide.get('title', '') or slide.get('main', '')
        
        if slide_type == 'title':
            t = SCENE_TEMPLATES["cover"]
            scene = t["scene"]
            if self.topic:
                scene = f"scenic landscape related to '{self.topic}', " + scene
            hint = t["position_hint"]
        
        elif slide_type == 'closing':
            t = SCENE_TEMPLATES["closing"]
            scene = t["scene"]
            if self.topic:
                scene = f"warm closing visual for '{self.topic}', " + scene
            hint = t["position_hint"]
        
        elif slide_type == 'section':
            t = SCENE_TEMPLATES["section"]
            sec = slide.get('title', '') or slide.get('subtitle', '')
            if self.topic:
                scene = f"thematic visual for '{self.topic}' section '{sec}', " + t["scene"]
            else:
                scene = f"thematic visual representing '{sec}', " + t["scene"]
            hint = t["position_hint"]
        
        else:
            # 位置提示
            if idx == 0: hint = "wide panoramic composition, epic view, "
            elif idx == total_pages - 1: hint = "warm emotional composition, golden hour lighting, "
            elif total_pages > 0 and idx / total_pages < 0.33: hint = "bright morning atmosphere, fresh composition, "
            elif total_pages > 0 and idx / total_pages > 0.67: hint = "warm afternoon lighting, relaxed composition, "
            else: hint = "balanced composition, natural lighting, "
            
            category = self._detect_category(slide)
            
            if category == 'tea_ceremony':
                scene = self._get_tea_scene(title or '')
            elif category and category in CONTENT_CATEGORIES:
                scene = f"professional photography related to '{title}', clean composition, natural lighting, realistic details"
            else:
                scene = f"visual related to '{title}', clean composition, natural lighting, realistic details"
            
            if self.topic and self.topic not in scene:
                scene = f"in the context of {self.topic}, " + scene
        
        return f"{scene}, {hint}{PHOTOREALISTIC_SUFFIX}"
    
    def generate_all_prompts(self, slides: List[Dict]) -> Dict[int, str]:
        return {idx: self.generate_prompt(slide, idx, len(slides)) for idx, slide in enumerate(slides)}


def generate_image_prompts(slides: List[Dict], topic: str = "", style: str = "photorealistic") -> Dict[int, str]:
    agent = ImagePromptAgent(topic=topic, style=style)
    return agent.generate_all_prompts(slides)


def print_prompts(prompts: Dict[int, str], slides: List[Dict] = None):
    print("\n" + "=" * 80)
    print("  配图Prompt列表（写实风格 - V4.9.5智能通用版）")
    print("=" * 80)
    for idx, prompt in sorted(prompts.items()):
        title = (slides[idx].get('title', '') or slides[idx].get('main', '') or '')[:30] if slides and idx < len(slides) else ''
        print(f"\n📄 Page {idx}: {title}")
        print(f"   {prompt[:120]}...")
    print("\n" + "=" * 80)
