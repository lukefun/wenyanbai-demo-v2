// 生成卡片审核HTML文档 - 供外部老师校验
var fs = require('fs');
var window = {};
eval(fs.readFileSync(__dirname + '/data/cards.js', 'utf8'));
eval(fs.readFileSync(__dirname + '/data/categories.js', 'utf8'));

var cards = window.CARDS;
var cats = window.CATEGORIES;

// 按字分组
var groups = {};
var charOrder = [];
cards.forEach(function(c, i) {
  if (!groups[c.c]) { groups[c.c] = []; charOrder.push(c.c); }
  groups[c.c].push({ card: c, idx: i });
});

var html = '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8">';
html += '<title>文言实词虚词学习卡片 · 教师审核稿</title>';
html += '<style>';
html += 'body{font-family:"Microsoft YaHei","PingFang SC",sans-serif;max-width:900px;margin:0 auto;padding:20px;color:#333;line-height:1.7;font-size:14px}';
html += 'h1{text-align:center;color:#8b4513;border-bottom:3px solid #8b4513;padding-bottom:10px}';
html += 'h2{color:#2c5f8a;border-left:4px solid #2c5f8a;padding-left:10px;margin-top:30px;background:#f0f6fc;padding:8px 12px}';
html += '.legend{background:#fffbe6;border:1px solid #ffe58f;padding:16px;border-radius:8px;margin:20px 0}';
html += '.legend h3{margin:0 0 10px;color:#d48806}';
html += '.legend table{width:100%;border-collapse:collapse}';
html += '.legend td{padding:6px 10px;border:1px solid #ffe58f;vertical-align:top}';
html += '.legend td:first-child{font-weight:bold;width:60px;color:#8b4513}';
html += '.card{border:1px solid #ddd;border-radius:8px;padding:12px 16px;margin:10px 0;background:#fafafa;page-break-inside:avoid}';
html += '.card:hover{border-color:#2c5f8a;background:#f0f6fc}';
html += '.card-idx{color:#999;font-size:12px;float:right}';
html += '.card-char{font-size:24px;font-weight:900;color:#8b4513;display:inline-block;margin-right:10px}';
html += '.card-type{display:inline-block;background:#e8f0fe;color:#2c5f8a;padding:2px 8px;border-radius:4px;font-size:12px}';
html += '.card-sent{margin:8px 0;padding:8px 12px;background:#fff;border-left:3px solid #2c5f8a;border-radius:0 4px 4px 0}';
html += '.card-sent .hl{color:#d05050;font-weight:bold}';
html += '.card-src{color:#888;font-size:13px;text-align:right}';
html += '.card-meaning{margin:6px 0;font-size:15px;font-weight:bold;color:#2d6a4f}';
html += '.card-tip{color:#666;font-size:13px;margin:4px 0;padding:4px 8px;background:#f0f9f4;border-radius:4px}';
html += '.card-others{margin:6px 0}';
html += '.card-others-title{font-size:12px;color:#888;cursor:pointer}';
html += '.card-others-item{display:inline-block;background:#f0f0f0;padding:2px 8px;border-radius:10px;margin:2px;font-size:12px;color:#555}';
html += '.error-box{border:2px dashed #d05050;background:#fff5f5;padding:8px;margin:4px 0;border-radius:4px}';
html += '.error-box textarea{width:100%;min-height:40px;border:1px solid #ddd;border-radius:4px;padding:6px;font-family:inherit;font-size:13px;resize:vertical}';
html += '.stats{background:#f0f9f4;border:1px solid #b7e4c7;padding:12px 16px;border-radius:8px;margin:16px 0}';
html += '.stats span{display:inline-block;margin-right:20px;font-weight:bold;color:#2d6a4f}';
html += '@media print{.card{break-inside:avoid}h2{break-after:avoid}.no-print{display:none}}';
html += '.toc{columns:4;column-gap:16px;margin:16px 0}';
html += '.toc-item{break-inside:avoid;padding:2px 0}';
html += '.toc-char{font-weight:bold;color:#8b4513}';
html += '.toc-count{color:#888;font-size:12px}';
html += '</style></head><body>';

// 标题
html += '<h1>📚 文言实词虚词学习卡片 · 教师审核稿</h1>';

// 统计
html += '<div class="stats">';
html += '<span>📊 总卡片数：' + cards.length + '</span>';
html += '<span>📝 涉及字词：' + charOrder.length + ' 个</span>';
html += '<span>📖 虚词卡片：' + cards.filter(function(c){return c.t==='虚词'}).length + '</span>';
html += '<span>📖 实词卡片：' + cards.filter(function(c){return c.t==='实词'}).length + '</span>';
html += '</div>';

// 字段说明
html += '<div class="legend">';
html += '<h3>📋 卡片字段说明（请重点审核以下字段）</h3>';
html += '<table>';
html += '<tr><td>c (字)</td><td>卡片所解释的字词</td><td>✅ 检查：字是否正确</td></tr>';
html += '<tr><td>t (类别)</td><td>虚词 / 实词</td><td>✅ 检查：分类是否正确</td></tr>';
html += '<tr><td>s (例句)</td><td>包含该字的原文例句，<span class="hl">红色高亮</span>标注目标字</td><td>✅ <b>重点检查</b>：例句是否准确、出处是否正确、高亮位置是否正确</td></tr>';
html += '<tr><td>r (出处)</td><td>例句的出处（篇名/作者）</td><td>✅ <b>重点检查</b>：出处是否准确</td></tr>';
html += '<tr><td>m (含义)</td><td>该字在例句中的含义解释</td><td>✅ <b>重点检查</b>：含义解释是否准确、是否符合中考/高考标准</td></tr>';
html += '<tr><td>p (助记)</td><td>通俗化的记忆提示</td><td>✅ 检查：解释是否通俗易懂、是否有误导</td></tr>';
html += '<tr><td>o (其他)</td><td>该字的其他常见用法（作为干扰项）</td><td>✅ 检查：其他用法是否准确、是否是该字的真实用法</td></tr>';
html += '</table>';
html += '<p style="margin:10px 0 0;color:#d48806"><b>💡 使用方法：</b>每张卡片下方有"批注"框，如发现错误请直接在其中标注修改意见。打印后可手写批注。</p>';
html += '</div>';

// 目录
html += '<h2>📑 字词目录</h2>';
html += '<div class="toc">';
charOrder.forEach(function(ch) {
  var items = groups[ch];
  var type = items[0].card.t;
  html += '<div class="toc-item"><span class="toc-char">' + ch + '</span> <span class="toc-count">(' + type + ' ' + items.length + '张)</span></div>';
});
html += '</div>';

// 按字输出卡片
var cardNum = 0;
charOrder.forEach(function(ch) {
  var items = groups[ch];
  var type = items[0].card.t;
  html += '<h2>' + ch + ' <span style="font-weight:normal;font-size:14px;color:#888">(' + type + '，共 ' + items.length + ' 张卡片)</span></h2>';
  
  items.forEach(function(item) {
    cardNum++;
    var c = item.card;
    var idx = item.idx;
    
    html += '<div class="card">';
    html += '<div class="card-idx">卡片 #' + (idx + 1) + ' / 共 ' + cards.length + '</div>';
    html += '<span class="card-char">' + c.c + '</span>';
    html += '<span class="card-type">' + c.t + '</span>';
    html += '<div class="card-sent">' + c.s + '</div>';
    html += '<div class="card-src">—— ' + c.r + '</div>';
    html += '<div class="card-meaning">📌 含义：' + c.m + '</div>';
    html += '<div class="card-tip">💡 助记：' + c.p + '</div>';
    
    if (c.o && c.o.length > 0) {
      html += '<div class="card-others">';
      html += '<div class="card-others-title">📎 其他用法（干扰项）：</div>';
      c.o.forEach(function(o) {
        html += '<span class="card-others-item">' + o + '</span>';
      });
      html += '</div>';
    }
    
    // 批注区域
    html += '<div class="error-box no-print">';
    html += '<div style="font-size:12px;color:#d05050;margin-bottom:4px">✏️ 批注（如发现错误请在此标注）：</div>';
    html += '<textarea placeholder="如：含义解释不准确，应为……；例句出处应为……；高亮位置有误……"></textarea>';
    html += '</div>';
    
    html += '</div>';
  });
});

// 底部汇总
html += '<h2>📝 总结与修改建议</h2>';
html += '<div class="error-box no-print" style="min-height:200px">';
html += '<div style="font-size:13px;color:#d05050;margin-bottom:6px">整体修改建议：</div>';
html += '<textarea style="min-height:150px" placeholder="请在此填写整体修改建议，如哪些字的解释需要统一调整、哪些例句需要替换等"></textarea>';
html += '</div>';

html += '<script>';
html += 'document.addEventListener("DOMContentLoaded",function(){';
html += 'document.querySelectorAll(".card .error-box textarea").forEach(function(ta){';
html += 'ta.addEventListener("input",function(){';
html += 'var card=this.closest(".card");';
html += 'if(card){card.style.borderColor=this.value?"#d05050":"#ddd";card.style.background=this.value?"#fff5f5":"#fafafa";}';
html += '});});});';
html += '</script>';

html += '</body></html>';

fs.writeFileSync(__dirname + '/cards_review.html', html, 'utf8');
console.log('审核文档已生成: cards_review.html');
console.log('总卡片数: ' + cards.length);
console.log('涉及字词: ' + charOrder.length);
