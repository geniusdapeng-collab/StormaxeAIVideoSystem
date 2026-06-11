/**
 * 山海经异兽档案系统 v1.0-Peng
 * 
 * 基于大鹏提供的《山海经四十大神兽图鉴》建立的完整档案库
 * 收录40只神兽，每只包含标准化档案
 */

const BEAST_INDEX = [
  { id: 'zhulong', name: '烛龙', nameEn: 'Zhulong', category: '创世神祇', no: 1, keywords: ['烛龙', '烛九阴', '烛阴', '火精'] },
  { id: 'yinglong', name: '应龙', nameEn: 'Yinglong', category: '上古凶兽', no: 2, keywords: ['应龙', '黄龙', '庚辰', '飞龙'] },
  { id: 'fenghuang', name: '凤凰', nameEn: 'Fenghuang', category: '百鸟之王', no: 3, keywords: ['凤凰', '凤皇', '鸾鸟', '百鸟之王'] },
  { id: 'qilin', name: '麒麟', nameEn: 'Qilin', category: '仁德之兽', no: 4, keywords: ['麒麟', '仁兽', '骐麟', '四灵'] },
  { id: 'baize', name: '白泽', nameEn: 'Baize', category: '智慧神兽', no: 5, keywords: ['白泽', '智慧神兽', '百科全书', '白泽图'] },
  { id: 'taotie', name: '饕餮', nameEn: 'Taotie', category: '四大凶兽', no: 6, keywords: ['饕餮', '狍鸮', '贪欲', '四大凶兽'] },
  { id: 'qiongqi', name: '穷奇', nameEn: 'Qiongqi', category: '四大凶兽', no: 7, keywords: ['穷奇', '少昊氏', '神狗', '背信弃义'] },
  { id: 'hundun', name: '混沌', nameEn: 'Hundun', category: '四大凶兽', no: 8, keywords: ['混沌', '浑沌', '帝江', '帝鸿'] },
  { id: 'taowu', name: '梼杌', nameEn: 'Taowu', category: '四大凶兽', no: 9, keywords: ['梼杌', '傲狠', '难训', '颛顼氏'] },
  { id: 'jiuweihu', name: '九尾狐', nameEn: 'Nine-Tailed Fox', category: '亦正亦邪', no: 10, keywords: ['九尾狐', '青丘狐', '涂山狐', '妲己'] },
  { id: 'xiangliu', name: '相柳', nameEn: 'Xiangliu', category: '九首凶神', no: 11, keywords: ['相柳', '相繇', '九首', '蛇身'] },
  { id: 'bifang', name: '毕方', nameEn: 'Bifang', category: '火灾之兆', no: 12, keywords: ['毕方', '独脚', '火鸟', '兆火'] },
  { id: 'kui', name: '夔', nameEn: 'Kui', category: '独脚雷兽', no: 13, keywords: ['夔', '夔牛', '雷兽', '独脚'] },
  { id: 'qinglong', name: '青龙', nameEn: 'Qinglong', category: '四灵之首', no: 14, keywords: ['青龙', '苍龙', '孟章神君', '四灵之首'] },
  { id: 'baihu', name: '白虎', nameEn: 'Baihu', category: '战神杀伐', no: 15, keywords: ['白虎', '监兵神君', '战神', '四灵'] },
  { id: 'zhuque', name: '朱雀', nameEn: 'Zhuque', category: '火德之精', no: 16, keywords: ['朱雀', '陵光神君', '火德', '四灵'] },
  { id: 'xuanwu', name: '玄武', nameEn: 'Xuanwu', category: '龟蛇合体', no: 17, keywords: ['玄武', '龟蛇', '真武大帝', '四灵'] },
  { id: 'gudiao', name: '蛊雕', nameEn: 'Gudiao', category: '食人怪兽', no: 18, keywords: ['蛊雕', '纂雕', '食人', '声诱'] },
  { id: 'tiangou', name: '天狗', nameEn: 'Tiangou', category: '天象异兽', no: 19, keywords: ['天狗', '天犬', '食月', '日食'] },
  { id: 'zheng', name: '狰', nameEn: 'Zheng', category: '赤豹猛兽', no: 20, keywords: ['狰', '狰狞', '赤豹', '五尾独角'] },
  { id: 'luoyu', name: '蠃鱼', nameEn: 'Luoyu', category: '水灾预警', no: 21, keywords: ['蠃鱼', '鱼身鸟翼', '水灾', '邽山'] },
  { id: 'xuanyuan', name: '旋龟', nameEn: 'Xuangui', category: '长寿灵龟', no: 22, keywords: ['旋龟', '玄龟', '鸟首', '虺尾'] },
  { id: 'huashe', name: '化蛇', nameEn: 'Huashe', category: '洪水毁灭', no: 23, keywords: ['化蛇', '人面豺身', '洪水', '阳山'] },
  { id: 'luwu', name: '陆吾', nameEn: 'Luwu', category: '天界守护者', no: 24, keywords: ['陆吾', '昆仑', '九尾', '虎身'] },
  { id: 'yingzhao', name: '英招', nameEn: 'Yingzhao', category: '自由之灵', no: 25, keywords: ['英招', '槐江', '马身人面', '虎文鸟翼'] },
  { id: 'zhujian', name: '诸犍', nameEn: 'Zhujian', category: '力量图腾', no: 26, keywords: ['诸犍', '胖郎神', '人首豹身', '独目'] },
  { id: 'feiyi', name: '肥遗', nameEn: 'Feiyi', category: '旱灾使者', no: 27, keywords: ['肥遗', '六足四翼', '一首两身', '旱灾'] },
  { id: 'suanni', name: '狻猊', nameEn: 'Suanni', category: '龙生九子', no: 28, keywords: ['狻猊', '龙生九子', '狮子', '喜火'] },
  { id: 'xiezhi', name: '獬豸', nameEn: 'Xiezhi', category: '司法公正', no: 29, keywords: ['獬豸', '任法兽', '独角', '司法'] },
  { id: 'chongming', name: '重明鸟', nameEn: 'Chongming', category: '光明正义', no: 30, keywords: ['重明鸟', '双睛', '双瞳', '驱邪'] },
  { id: 'kunpeng', name: '鲲鹏', nameEn: 'Kunpeng', category: '鱼鸟互变', no: 31, keywords: ['鲲鹏', '北冥', '鱼鸟', '逍遥游'] },
  { id: 'bashe', name: '巴蛇', nameEn: 'Bashe', category: '食象巨蟒', no: 32, keywords: ['巴蛇', '修蛇', '食象', '黑蛇青首'] },
  { id: 'lushu', name: '鹿蜀', nameEn: 'Lushu', category: '子孙昌盛', no: 33, keywords: ['鹿蜀', '杻阳', '马身虎纹', '赤尾'] },
  { id: 'wenyaoyu', name: '文鳐鱼', nameEn: 'Wenyaoyu', category: '丰收之兆', no: 34, keywords: ['文鳐鱼', '泰器', '夜飞', '丰收'] },
  { id: 'zhuyan', name: '朱厌', nameEn: 'Zhuyan', category: '兵灾凶兆', no: 35, keywords: ['朱厌', '白首赤足', '兵灾', '猿猴'] },
  { id: 'fuzhu', name: '夫诸', nameEn: 'Fuzhu', category: '水灾之兆', no: 36, keywords: ['夫诸', '四角白鹿', '敖岸', '水灾'] },
  { id: 'huodou', name: '祸斗', nameEn: 'Huodou', category: '火灾象征', no: 37, keywords: ['祸斗', '厌火', '食火', '火灾'] },
  { id: 'fei', name: '蜚', nameEn: 'Fei', category: '灾难之神', no: 38, keywords: ['蜚', '太山', '牛身白首', '瘟疫'] },
  { id: 'suanyu', name: '酸与', nameEn: 'Suanyu', category: '恐慌之鸟', no: 39, keywords: ['酸与', '景山', '四翼', '六目三足'] },
  { id: 'menghuai', name: '孟槐', nameEn: 'Menghuai', category: '御凶辟邪', no: 40, keywords: ['孟槐', '谯明', '赤毫', '辟邪'] }
];

module.exports = { BEAST_INDEX };