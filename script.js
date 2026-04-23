function formatNumber(input) {
    let value = input.value.replace(/,/g, '');
    value = value.replace(/[^0-9.]/g, ''); 
    if (value.length > 3) {
        let parts = value.split('.');
        let integer = parts[0];
        let decimal = parts.length > 1 ? '.' + parts[1] : '';
        let lastThree = integer.slice(-3);
        let otherNumbers = integer.slice(0, -3);
        if (otherNumbers) {
            otherNumbers = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
            integer = otherNumbers + "," + lastThree;
        }
        value = integer + decimal;
    }
    input.value = value;
}

document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', function() { 
        formatNumber(this); 
        // Remove red border as soon as the user starts typing
        this.classList.remove('error');
    });
});

function calculateRetirement() {
    const getVal = id => parseFloat(document.getElementById(id).value.replace(/,/g, '')) || 0;
    const requiredFields = [
        'presentAge', 'retireAge', 'lifeExpectancy', 
        'monthlyExpenses', 'inflationRate', 'preReturn', 'postReturn'
    ];
    
    let isValid = true;

    // 1. Validation Logic
    requiredFields.forEach(id => {
        const element = document.getElementById(id);
        if (element.value.trim() === "") {
            element.classList.add('error');
            isValid = false;
        } else {
            element.classList.remove('error');
        }
    });

    if (!isValid) return;

    const agePres = getVal('presentAge');
    const ageRet = getVal('retireAge');
    const ageLife = getVal('lifeExpectancy');
    const expMonthly = getVal('monthlyExpenses');
    const inflation = getVal('inflationRate') / 100;
    const invPres = getVal('currentInvestment'); 
    const ratePre = getVal('preReturn') / 100;
    const ratePost = getVal('postReturn') / 100;

    if (ageRet <= agePres || ageLife <= ageRet) {
        alert("Check your age inputs: Life Expectancy > Retirement Age > Present Age");
        return;
    }

    const nPre = ageRet - agePres;
    const nPost = ageLife - ageRet;

    // 2. Monthly Expenditure At Retirement (FV = PV * (1+r)^n)
    const expRet = expMonthly * Math.pow((1 + inflation), nPre);
    
    // 3. Total Amount Required (Corpus) - NISM Logic
    const realRateAnnual = ((1 + ratePost) / (1 + inflation)) - 1;
    const realRateMonthly = realRateAnnual / 12; 
    const totalMonthsPost = nPost * 12;

    // Ordinary Annuity Formula
    const corpusRequired = expRet * ((1 - Math.pow(1 + realRateMonthly, -totalMonthsPost)) / realRateMonthly);
    
    // 4. Monthly SIP Required (Goal SIP Logic)
    const fvExisting = invPres * Math.pow((1 + ratePre), nPre);
    const gap = Math.max(0, corpusRequired - fvExisting);
    
    const ratePreMonthly = ratePre / 12;
    const totalMonthsPre = nPre * 12;
    
    let sipRequired = 0;
    if (gap > 0) {
        // Annuity Due Formula (Payment at start of month)
        const denominator = ((Math.pow(1 + ratePreMonthly, totalMonthsPre) - 1) / ratePreMonthly)
        sipRequired = gap / denominator;
    }

    // 5. Formatting Logic (Lakh/Crore with Round Up)
    const formatToWords = num => {
        if (num >= 10000000) { // Crore
            const value = Math.ceil((num / 10000000) * 100) / 100;
            return `₹${value.toFixed(2)} Crore`;
        } else if (num >= 100000) { // Lakh
            const value = Math.ceil((num / 100000) * 100) / 100;
            return `₹${value.toFixed(2)} Lakh`;
        } else {
            // For smaller amounts (like some SIPs), use Indian Comma format
            let integer = Math.ceil(num).toString();
            if (integer.length > 3) {
                let lastThree = integer.slice(-3);
                let otherNumbers = integer.slice(0, -3);
                otherNumbers = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
                integer = otherNumbers + "," + lastThree;
            }
            return "₹" + integer;
        }
    };

    // 6. Display Results
    document.getElementById('resMonthlyExp').innerText = formatToWords(expRet);
    document.getElementById('resCorpus').innerText = formatToWords(corpusRequired);
    document.getElementById('resSIP').innerText = formatToWords(sipRequired);

    document.getElementById('results').style.display = 'block';
}