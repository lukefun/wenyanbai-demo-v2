/**
 * 字词分类数据
 * 基于上海市初中、高中文言文实词和虚词教学大纲
 *
 * 分类维度：
 * - 学段：初中必学 / 高中必学
 * - 考试：中考高频 / 高考高频
 * - 词性：初中实词 / 高中实词 / 初中虚词 / 高中虚词
 */
window.CATEGORIES = {
  // 中考考纲核心虚词 + 卡片中归为虚词且在初中实词文档部分出现的字
  初中虚词: '之其以于为乃则者所何安且若焉乎也与盖顾及而虽然故'.split(''),
  // 初中必考实词约130个
  初中实词: '安本比鄙兵病察长朝曾乘诚除辞次从殆当道得度非复负盖故固顾归国过何恨后胡患或疾及即既假间见解就举绝堪克类怜临弥名末莫乃内期奇迁请穷去劝却如若善少涉胜识使是适书孰属数率说私素汤涕徒亡王望微恶闻悉相谢信兴行幸修许阳要宜遗贻易阴引右逾狱再造知直置至致质治诸贼族卒走左坐爱伐方观加食鼓可徐'.split(''),
  // 高中新增实词约40个
  高中实词: '被倍称传奉发干更苟果怀会将经居立令略虑命谋难辟迫曲取任审甚实通图务效信延益用缘振志足'.split(''),
  // 高中扩展虚词（超出初中核心虚词的部分）
  高中虚词: '因是矣哉耳夫请即遂'.split('').concat(['唯/惟'])
};

// 计算派生分类
(function(){
  var C = window.CATEGORIES;

  // 初中必学 = 初中实词 ∪ 初中虚词
  var cSet = {};
  C.初中实词.forEach(function(c){cSet[c]=1;});
  C.初中虚词.forEach(function(c){cSet[c]=1;});
  C.初中必学 = Object.keys(cSet);

  // 高中必学 = 初中必学 ∪ 高中实词 ∪ 高中虚词
  var hSet = {};
  C.初中必学.forEach(function(c){hSet[c]=1;});
  C.高中实词.forEach(function(c){hSet[c]=1;});
  C.高中虚词.forEach(function(c){hSet[c]=1;});
  C.高中必学 = Object.keys(hSet);

  // 中考高频 = 初中必学
  C.中考高频 = C.初中必学.slice();

  // 高考高频 = 高中必学
  C.高考高频 = C.高中必学.slice();

  // 实词 / 虚词
  var swSet = {}, xwSet = {};
  C.初中实词.forEach(function(c){swSet[c]=1;});
  C.高中实词.forEach(function(c){swSet[c]=1;});
  C.初中虚词.forEach(function(c){xwSet[c]=1;});
  C.高中虚词.forEach(function(c){xwSet[c]=1;});
  C.实词 = Object.keys(swSet);
  C.虚词 = Object.keys(xwSet);
})();
