(function() {
    // ===== DOM 元素 =====
    var expressionEl = document.getElementById('expression');
    var resultEl = document.getElementById('result');
    var operatorBtns = document.querySelectorAll('[data-action="operator"]');

    // ===== 计算器状态 =====
    var currentInput = '0';        // 当前输入的数字
    var previousInput = '';        // 上一个输入的数字
    var operator = null;           // 当前运算符
    var shouldResetDisplay = false; // 是否需要在下次输入数字时重置显示
    var expressionText = '';       // 表达式文本
    var justCalculated = false;    // 是否刚完成计算

    // ===== 工具函数 =====

    /**
     * 格式化数字显示
     * - 限制最大位数，避免溢出
     * - 避免科学计数法
     */
    function formatNumber(num) {
        if (num === '' || num === '-') return num;
        var n = parseFloat(num);
        if (isNaN(n)) return '0';
        if (Math.abs(n) >= 1e15) return '溢出';

        var str = n.toString();
        if (str.length > 12) {
            if (str.includes('.')) {
                var parts = str.split('.');
                var avail = 11 - parts[0].length;
                if (avail > 0) {
                    return parseFloat(n.toFixed(avail)).toString();
                }
                return parseFloat(n.toPrecision(11)).toString();
            }
            return '溢出';
        }
        return str;
    }

    /**
     * 更新显示区域
     */
    function updateDisplay() {
        // 结果区
        var displayText = currentInput;
        if (displayText.length > 10) {
            resultEl.classList.add('shrink');
        } else {
            resultEl.classList.remove('shrink');
        }
        resultEl.textContent = formatNumber(displayText);

        // 表达式区
        if (expressionText) {
            expressionEl.textContent = expressionText;
        } else {
            expressionEl.innerHTML = '&nbsp;';
        }
    }

    /**
     * 高亮当前激活的运算符按钮
     */
    function highlightOperator(op) {
        operatorBtns.forEach(function(btn) {
            btn.classList.remove('active');
        });
        if (op) {
            operatorBtns.forEach(function(btn) {
                if (btn.dataset.value === op) {
                    btn.classList.add('active');
                }
            });
        }
    }

    /**
     * 执行四则运算
     */
    function calculate(a, op, b) {
        var numA = parseFloat(a);
        var numB = parseFloat(b);

        switch (op) {
            case '+': return numA + numB;
            case '-': return numA - numB;
            case '*': return numA * numB;
            case '/': return numB === 0 ? '错误' : numA / numB;
            default:  return numB;
        }
    }

    /**
     * 获取运算符显示符号
     */
    function getOpSymbol(op) {
        var symbols = { '+': '+', '-': '−', '*': '×', '/': '÷' };
        return symbols[op] || op;
    }

    /**
     * 重置所有状态
     */
    function resetAll() {
        currentInput = '0';
        previousInput = '';
        operator = null;
        shouldResetDisplay = false;
        expressionText = '';
        justCalculated = false;
    }

    // ===== 输入处理 =====

    /**
     * 处理数字输入
     */
    function inputNumber(num) {
        if (justCalculated) {
            // 刚计算完，重新开始
            currentInput = num;
            previousInput = '';
            operator = null;
            expressionText = '';
            justCalculated = false;
            highlightOperator(null);
        } else if (shouldResetDisplay) {
            currentInput = num;
            shouldResetDisplay = false;
        } else if (currentInput === '0' && num === '0') {
            // 禁止多个连续的 0
            return;
        } else if (currentInput === '0' && num !== '0') {
            currentInput = num;
        } else if (currentInput === '-0') {
            currentInput = '-' + num;
        } else {
            // 限制最大输入位数
            if (currentInput.replace(/[.-]/g, '').length >= 12) return;
            currentInput += num;
        }
        updateDisplay();
    }

    /**
     * 处理小数点输入
     */
    function inputDecimal() {
        if (justCalculated) {
            currentInput = '0.';
            previousInput = '';
            operator = null;
            expressionText = '';
            justCalculated = false;
            highlightOperator(null);
        } else if (shouldResetDisplay) {
            currentInput = '0.';
            shouldResetDisplay = false;
        } else if (!currentInput.includes('.')) {
            currentInput += '.';
        }
        updateDisplay();
    }

    /**
     * 处理运算符输入
     */
    function inputOperator(op) {
        if (justCalculated) {
            // 用上次结果继续运算
            expressionText = formatNumber(currentInput) + ' ' + getOpSymbol(op) + ' ';
            previousInput = currentInput;
            operator = op;
            shouldResetDisplay = true;
            justCalculated = false;
        } else if (operator && shouldResetDisplay) {
            // 切换运算符
            operator = op;
            expressionText = expressionText.slice(0, -2) + getOpSymbol(op) + ' ';
        } else if (operator && !shouldResetDisplay) {
            // 链式计算
            var result = calculate(previousInput, operator, currentInput);
            if (result === '错误') {
                resetAll();
                resultEl.textContent = '错误';
                return;
            }
            currentInput = result.toString();
            previousInput = currentInput;
            operator = op;
            expressionText = formatNumber(currentInput) + ' ' + getOpSymbol(op) + ' ';
            shouldResetDisplay = true;
        } else {
            // 首次输入运算符
            previousInput = currentInput;
            operator = op;
            expressionText = formatNumber(currentInput) + ' ' + getOpSymbol(op) + ' ';
            shouldResetDisplay = true;
        }

        highlightOperator(op);
        updateDisplay();
    }

    /**
     * 处理等号（计算结果）
     */
    function inputEquals() {
        if (justCalculated) return;

        if (operator && !shouldResetDisplay) {
            var result = calculate(previousInput, operator, currentInput);
            if (result === '错误') {
                resetAll();
                resultEl.textContent = '错误';
                return;
            }
            expressionText = formatNumber(previousInput) + ' ' + getOpSymbol(operator) +
                ' ' + formatNumber(currentInput) + ' =';
            currentInput = result.toString();
            previousInput = '';
            operator = null;
            justCalculated = true;
            highlightOperator(null);
        } else if (operator && shouldResetDisplay && previousInput) {
            // 重复按等号：用上一个运算符再次计算
            var result = calculate(currentInput, operator, previousInput);
            if (result === '错误') {
                resetAll();
                resultEl.textContent = '错误';
                return;
            }
            expressionText = formatNumber(currentInput) + ' ' + getOpSymbol(operator) + ' ' +
                formatNumber(previousInput) + ' =';
            currentInput = result.toString();
            justCalculated = true;
            highlightOperator(null);
        }

        updateDisplay();
    }

    /**
     * 处理退格
     */
    function inputBackspace() {
        if (justCalculated || shouldResetDisplay) return;
        if (currentInput.length === 1 ||
            (currentInput.length === 2 && currentInput.startsWith('-'))) {
            currentInput = '0';
        } else {
            currentInput = currentInput.slice(0, -1);
        }
        updateDisplay();
    }

    /**
     * 处理全部清除
     */
    function inputClear() {
        resetAll();
        updateDisplay();
        highlightOperator(null);
    }

    /**
     * 处理百分比
     */
    function inputPercent() {
        if (currentInput === '0' || currentInput === '') return;
        var num = parseFloat(currentInput) / 100;
        currentInput = num.toString();
        updateDisplay();
    }

    /**
     * 处理正负号切换
     */
    function inputNegate() {
        if (currentInput === '0' || currentInput === '') return;
        if (currentInput.startsWith('-')) {
            currentInput = currentInput.slice(1);
        } else {
            currentInput = '-' + currentInput;
        }
        updateDisplay();
    }

    // ===== 事件绑定 =====

    /**
     * 按钮点击
     */
    document.querySelector('.buttons').addEventListener('click', function(e) {
        var btn = e.target.closest('button');
        if (!btn) return;

        addRipple(e, btn);

        var action = btn.dataset.action;
        var value = btn.dataset.value;

        switch (action) {
            case 'number':   inputNumber(value);   break;
            case 'decimal':  inputDecimal();        break;
            case 'operator': inputOperator(value);  break;
            case 'calculate':inputEquals();          break;
            case 'clear':    inputClear();           break;
            case 'backspace':inputBackspace();       break;
            case 'percent':  inputPercent();         break;
            case 'negate':   inputNegate();          break;
        }
    });

    /**
     * 波纹效果
     */
    function addRipple(e, btn) {
        var ripple = document.createElement('span');
        ripple.classList.add('ripple-effect');
        var rect = btn.getBoundingClientRect();
        var size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
        btn.appendChild(ripple);
        ripple.addEventListener('animationend', function() {
            ripple.remove();
        });
    }

    /**
     * 键盘支持
     */
    document.addEventListener('keydown', function(e) {
        var key = e.key;

        if (key >= '0' && key <= '9') {
            inputNumber(key);
            flashButton('[data-action="number"][data-value="' + key + '"]');
        } else if (key === '.') {
            inputDecimal();
            flashButton('[data-action="decimal"]');
        } else if (key === '+') {
            inputOperator('+');
            flashButton('[data-action="operator"][data-value="+"]');
        } else if (key === '-') {
            inputOperator('-');
            flashButton('[data-action="operator"][data-value="-"]');
        } else if (key === '*') {
            inputOperator('*');
            flashButton('[data-action="operator"][data-value="*"]');
        } else if (key === '/') {
            e.preventDefault();
            inputOperator('/');
            flashButton('[data-action="operator"][data-value="/"]');
        } else if (key === 'Enter' || key === '=') {
            e.preventDefault();
            inputEquals();
            flashButton('[data-action="calculate"]');
        } else if (key === 'Backspace') {
            inputBackspace();
            flashButton('[data-action="backspace"]');
        } else if (key === 'Escape' || key === 'Delete') {
            inputClear();
            flashButton('[data-action="clear"]');
        } else if (key === '%') {
            inputPercent();
            flashButton('[data-action="percent"]');
        }
    });

    /**
     * 键盘操作时按钮闪烁反馈
     */
    function flashButton(selector) {
        var btn = document.querySelector(selector);
        if (!btn) return;
        btn.style.transform = 'scale(0.92)';
        setTimeout(function() {
            btn.style.transform = '';
        }, 100);
    }

    // ===== 初始化 =====
    updateDisplay();
})();
