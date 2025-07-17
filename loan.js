// 切换贷款类型显示
const loanTypeSelect = document.getElementById('loanType');
const loanInputs = document.getElementById('loanInputs');
const combinedLoanInputs = document.getElementById('combinedLoanInputs');
const providentLoanInputs = document.getElementById('providentLoanInputs');

loanTypeSelect.addEventListener('change', () => {
  const type = loanTypeSelect.value;
  loanInputs.style.display = type === 'commercial' ? 'block' : 'none';
  combinedLoanInputs.style.display = type === 'combined' ? 'block' : 'none';
  providentLoanInputs.style.display = type === 'provident' ? 'block' : 'none';
});

// DOM 变量
const startDateInput = document.getElementById('startDate');
const prepayAmountInput = document.getElementById('prepayAmount');
const prepayDateInput = document.getElementById('prepayDate');
const addPrepayBtn = document.getElementById('addPrepayBtn');
const prepayRecordsUl = document.getElementById('prepayRecords');
const prepaySection = document.getElementById('prepaySection');
const resultDiv = document.getElementById('result');

let prepayList = [];

// 控制提前还款启用
startDateInput.addEventListener('input', () => {
  const hasDate = startDateInput.value !== '';
  prepaySection.classList.toggle('disabled', !hasDate);
  prepayAmountInput.disabled = !hasDate;
  prepayDateInput.disabled = !hasDate;
  addPrepayBtn.disabled = !hasDate;
});

// 添加提前还款
addPrepayBtn.addEventListener('click', () => {
  const amount = parseFloat(prepayAmountInput.value);
  const date = prepayDateInput.value;
  if (!date) return alert("请选择提前还款日期");
  if (isNaN(amount) || amount <= 0) return alert("请输入有效的提前还款金额");

  prepayList.push({ date, amount });
  prepayList.sort((a, b) => new Date(a.date) - new Date(b.date));
  renderPrepayRecords();
  prepayAmountInput.value = '';
  prepayDateInput.value = '';
});

function renderPrepayRecords() {
  prepayRecordsUl.innerHTML = '';
  prepayList.forEach((item, idx) => {
    const li = document.createElement('li');
    li.textContent = `提前还款 ${item.amount.toFixed(2)} 元，日期：${item.date}`;
    const delBtn = document.createElement('button');
    delBtn.textContent = '删除';
    delBtn.style.marginLeft = '10px';
    delBtn.onclick = () => {
      prepayList.splice(idx, 1);
      renderPrepayRecords();
    };
    li.appendChild(delBtn);
    prepayRecordsUl.appendChild(li);
  });
}

// 计算主流程
document.getElementById('calcBtn').addEventListener('click', () => {
  if (startDateInput.value === '') {
    prepayList = [];
    renderPrepayRecords();
  }
  const plans = calculateFullPlan();
  renderResultTable(plans);
});

// 获取贷款数据
function getLoanData() {
  const type = loanTypeSelect.value;
  let loans = [];

  if (type === 'combined') {
    const commercialAmount = parseFloat(document.getElementById('commercialAmount').value) * 10000 || 0;
    const commercialRate = parseFloat(document.getElementById('commercialRate').value) / 100 || 0;
    const providentAmount = parseFloat(document.getElementById('providentAmount').value) * 10000 || 0;
    const providentRate = parseFloat(document.getElementById('providentRate').value) / 100 || 0;

    if (commercialAmount > 0) loans.push({ amount: commercialAmount, rate: commercialRate });
    if (providentAmount > 0) loans.push({ amount: providentAmount, rate: providentRate });

  } else if (type === 'provident') {
    const loanAmount = parseFloat(document.getElementById('providentOnlyAmount').value) * 10000 || 0;
    const rate = parseFloat(document.getElementById('providentOnlyRate').value) / 100 || 0;
    loans.push({ amount: loanAmount, rate });

  } else {
    const loanAmount = parseFloat(document.getElementById('loanAmount').value) * 10000 || 0;
    const rate = parseFloat(document.getElementById('rate').value) / 100 || 0;
    loans.push({ amount: loanAmount, rate });
  }

  return loans;
}

// 生成完整还款计划（含多次提前还款）
function calculateFullPlan() {
  const loans = getLoanData();
  const years = parseInt(document.getElementById('years').value);
  const months = years * 12;
  const method = document.getElementById('method').value;
  const startDateVal = startDateInput.value;

  const startDate = startDateVal ? new Date(startDateVal) : null;
  let remainPrincipalList = loans.map(l => l.amount);
  let plans = [];

  function getMonthIndex(dateStr) {
    const d = new Date(dateStr);
    return (d.getFullYear() - startDate.getFullYear()) * 12 + (d.getMonth() - startDate.getMonth());
  }

  prepayList.sort((a, b) => new Date(a.date) - new Date(b.date));

  let prevMonth = 0;
  for (let i = 0; i <= prepayList.length; i++) {
    const prepayMonth = i < prepayList.length ? getMonthIndex(prepayList[i].date) : months;
    const segmentMonths = prepayMonth - prevMonth;
    if (segmentMonths <= 0) continue;

    const plan = baseCalculate(loans, method, segmentMonths, remainPrincipalList, startDate, prevMonth);
    plans.push(plan);

    if (i < prepayList.length) {
      const totalRemain = remainPrincipalList.reduce((a, b) => a + b, 0);
      let remainAfterPrepay = totalRemain - prepayList[i].amount;
      if (remainAfterPrepay < 0) remainAfterPrepay = 0;
      remainPrincipalList = remainPrincipalList.map(p => p * remainAfterPrepay / totalRemain);
      prevMonth = prepayMonth;
    }
  }

  return plans;
}

// 核心还款计算
function baseCalculate(loans, method, months, remainPrincipalList, startDate, startMonthOffset) {
  let monthlyDetails = [];
  let dates = [];

  loans.forEach((loan, idx) => {
    const monthlyRate = loan.rate / 12;
    let remain = remainPrincipalList[idx];

    let monthlyPayment = 0;
    if (method === 'equalPrincipalAndInterest') {
      monthlyPayment = remain * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
    }

    for (let i = 0; i < months; i++) {
      const interest = remain * monthlyRate;
      let principal, monthlyPay;

      if (method === 'equalPrincipalAndInterest') {
        principal = monthlyPayment - interest;
        monthlyPay = monthlyPayment;
      } else {
        principal = remain / (months - i);
        monthlyPay = principal + interest;
      }

      remain -= principal;

      if (!monthlyDetails[i]) monthlyDetails[i] = { total: 0, interest: 0, principal: 0 };
      monthlyDetails[i].total += monthlyPay;
      monthlyDetails[i].interest += interest;
      monthlyDetails[i].principal += principal;
    }
  });

  if (startDate) {
    const baseDate = new Date(startDate);
    baseDate.setMonth(baseDate.getMonth() + startMonthOffset);
    for (let i = 0; i < months; i++) {
      const d = new Date(baseDate);
      d.setMonth(d.getMonth() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
  }

  return { monthlyDetails, dates };
}

// 渲染还款计划表
function renderResultTable(plans) {
  const today = new Date();
  const hasStartDate = startDateInput.value !== '';
  let html = '';

  plans.forEach((plan, idx) => {
    html += `<h3>${idx === 0 ? '原始还款计划' : `提前还款后计划 ${idx}`}</h3>`;
    html += `<table><tr><th>期数</th>`;
    if (hasStartDate) html += `<th>还款日</th>`;
    html += `<th>月还款</th><th>利息</th><th>本金</th></tr>`;

    let nearestIndex = hasStartDate ? plan.dates.findIndex(d => new Date(d) >= today) : -1;

    plan.monthlyDetails.forEach((item, idx2) => {
      const highlight = idx2 === nearestIndex ? ' class="highlight"' : '';
      html += `<tr${highlight}><td>${idx2 + 1}</td>`;
      if (hasStartDate) html += `<td>${plan.dates[idx2] || ''}</td>`;
      html += `<td>${item.total.toFixed(2)}</td><td>${item.interest.toFixed(2)}</td><td>${item.principal.toFixed(2)}</td></tr>`;
    });

    html += `</table>`;
  });

  resultDiv.innerHTML = html;
}

// 帮助弹窗逻辑
const helpBtn = document.getElementById('helpBtn');
const helpModal = document.getElementById('helpModal');
const closeHelp = document.getElementById('closeHelp');

helpBtn.onclick = () => {
  helpModal.style.display = 'block';
};

closeHelp.onclick = () => {
  helpModal.style.display = 'none';
};

window.onclick = (event) => {
  if (event.target === helpModal) {
    helpModal.style.display = 'none';
  }
};

// 网站信息弹窗
const infoModal = document.getElementById('infoModal');
const infoContent = document.getElementById('infoContent');
const closeInfo = document.getElementById('closeInfo');

function openInfo(type) {
  let content = '';

  if (type === 'disclaimer') {
    content = `
      <h3>免责声明</h3>
      <p>本网站所提供的各类文件分享、贷款计算等功能，仅供用户参考和个人使用。</p>
      <p>所有计算结果和分享文件不代表任何法律或金融建议，实际结果请以相关专业机构或官方发布为准。</p>
      <p>对于用户上传的文件或使用计算结果所产生的任何直接或间接损失，本网站不承担任何责任。</p>
      <p>用户需自行保证上传文件的合法性与安全性，严禁上传违法或侵权文件。</p>
    `;
  } else if (type === 'privacy') {
    content = `
      <h3>隐私政策</h3>
      <p>本网站尊重并保护所有用户的隐私权。</p>
      <p>我们不会主动收集或保存用户的个人信息。</p>
      <p>上传的临时文件仅用于文件分享，不会被用于其他用途，且会在一定时间内自动删除。</p>
      <p>如网站使用Google广告，第三方广告可能会使用Cookie收集访问统计信息，用于广告优化。</p>
      <p>我们承诺不会将任何收集到的用户信息出售或泄露给第三方。</p>
    `;
  } else if (type === 'contact') {
    content = `
      <h3>联系我们</h3>
      <p>如果您在使用过程中遇到问题或有任何建议，请通过以下方式与我们联系：</p>
      <p>电子邮件：<a href="mailto:admin@0515364.xyz">admin@0515364.xyz</a></p>
      <p>我们将在收到邮件后尽快回复。</p>
    `;
  }

  infoContent.innerHTML = content;
  infoModal.style.display = 'block';
}

closeInfo.onclick = () => {
  infoModal.style.display = 'none';
};

window.onclick = (event) => {
  if (event.target === infoModal) {
    infoModal.style.display = 'none';
  }
};