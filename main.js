const priceInput = document.getElementById('price');
const downPaymentInput = document.getElementById('downPayment');
const yearsInput = document.getElementById('years');
const rateInput = document.getElementById('rate');
const methodSelect = document.getElementById('method');
const calcBtn = document.getElementById('calcBtn');
const resultDiv = document.getElementById('result');

calcBtn.addEventListener('click', calculate);

function calculate() {
  const totalPrice = parseFloat(priceInput.value) * 10000;
  const downPaymentRate = parseFloat(downPaymentInput.value) / 100;
  const loanYears = parseInt(yearsInput.value);
  const annualRate = parseFloat(rateInput.value) / 100;
  const method = methodSelect.value;

  const loanAmount = totalPrice * (1 - downPaymentRate);
  const monthlyRate = annualRate / 12;
  const months = loanYears * 12;

  let monthlyPayment = 0;
  let totalInterest = 0;
  let totalRepayment = 0;

  if (method === 'equalPrincipalAndInterest') {
    // 等额本息
    monthlyPayment = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
    totalRepayment = monthlyPayment * months;
    totalInterest = totalRepayment - loanAmount;
  } else {
    // 等额本金
    const monthlyPrincipal = loanAmount / months;
    totalInterest = 0;
    for (let i = 0; i < months; i++) {
      const interest = (loanAmount - monthlyPrincipal * i) * monthlyRate;
      totalInterest += interest;
    }
    totalRepayment = loanAmount + totalInterest;
    monthlyPayment = monthlyPrincipal + (loanAmount * monthlyRate);
  }

  resultDiv.innerHTML = `
    <strong>贷款总额：</strong>${loanAmount.toFixed(2)} 元<br>
    <strong>每月还款：</strong>${monthlyPayment.toFixed(2)} 元<br>
    <strong>支付利息：</strong>${totalInterest.toFixed(2)} 元<br>
    <strong>还款总额：</strong>${totalRepayment.toFixed(2)} 元
  `;
}