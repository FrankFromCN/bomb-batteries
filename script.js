const AppState = {
    selectedBatteryTypes: [],
    calculatorResults: null,
    validationErrors: {}
};

const Utils = {
    safeExecute: function(func, errorMessage = "An error occurred") {
        try {
            return func();
        } catch (error) {
            console.error(errorMessage, error);
            this.showError(errorMessage);
            return null;
        }
    },

    showError: function(message) {
        let errorDiv = document.getElementById('globalError');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'globalError';
            errorDiv.style.cssText = 'position:fixed;top:80px;right:20px;background:#ff4757;color:white;padding:15px;border-radius:5px;z-index:1001;max-width:300px;';
            document.body.appendChild(errorDiv);
        }
        errorDiv.textContent = message;
        setTimeout(() => errorDiv.remove(), 5000);
    },

    validateEmail: function(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    validatePhone: function(phone) {
        const re = /^[\+]?[1-9][\d]{0,15}$/;
        return phone === '' || re.test(phone.replace(/[\s\-\(\)]/g, ''));
    },

    formatNumber: function(num, decimals = 2) {
        return parseFloat(num).toFixed(decimals);
    }
};

const Navigation = {
    init: function() {
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');
        
        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                hamburger.classList.toggle('active');
            });

            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    navMenu.classList.remove('active');
                    hamburger.classList.remove('active');
                });
            });
        }
    }
};

const BatteryCalculator = {
    init: function() {
        const form = document.getElementById('batteryCalculator');
        if (form) {
            form.addEventListener('submit', this.handleSubmit.bind(this));
            
            const deviceType = document.getElementById('deviceType');
            if (deviceType) {
                deviceType.addEventListener('change', this.autoFillDeviceSpecs.bind(this));
            }
        }
    },

    autoFillDeviceSpecs: function(event) {
        const deviceType = event.target.value;
        const capacityInput = document.getElementById('batteryCapacity');
        const powerInput = document.getElementById('powerConsumption');
        const voltageInput = document.getElementById('voltage');

        switch (deviceType) {
            case 'smartphone':
                capacityInput.value = 4000;
                powerInput.value = 2500;
                voltageInput.value = 3.7;
                break;
            case 'laptop':
                capacityInput.value = 50000;
                powerInput.value = 45000;
                voltageInput.value = 11.1;
                break;
            case 'tablet':
                capacityInput.value = 8000;
                powerInput.value = 15000;
                voltageInput.value = 3.8;
                break;
            case 'car':
                capacityInput.value = 75000;
                powerInput.value = 150000;
                voltageInput.value = 400;
                break;
            default:
                capacityInput.value = '';
                powerInput.value = '';
                voltageInput.value = '3.7';
        }
    },

    handleSubmit: function(event) {
        event.preventDefault();
        
        Utils.safeExecute(() => {
            if (this.validateForm()) {
                const formData = this.getFormData();
                const results = this.performCalculations(formData);
                this.displayResults(results);
            }
        }, "Calculator error occurred");
    },

    validateForm: function() {
        const requiredFields = ['calculatorType', 'deviceType', 'batteryCapacity', 'powerConsumption', 'voltage', 'usageHours'];
        let isValid = true;

        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            const errorSpan = document.getElementById(fieldId + 'Error');
            
            if (!field.value.trim()) {
                errorSpan.textContent = 'This field is required';
                field.classList.add('error');
                isValid = false;
            } else {
                errorSpan.textContent = '';
                field.classList.remove('error');
            }
        });

        return isValid;
    },

    getFormData: function() {
        return {
            calculatorType: document.getElementById('calculatorType').value,
            deviceType: document.getElementById('deviceType').value,
            batteryCapacity: parseFloat(document.getElementById('batteryCapacity').value),
            powerConsumption: parseFloat(document.getElementById('powerConsumption').value),
            voltage: parseFloat(document.getElementById('voltage').value),
            usageHours: parseFloat(document.getElementById('usageHours').value),
            pricePerUnit: parseFloat(document.getElementById('pricePerUnit').value) || 0
        };
    },

    performCalculations: function(data) {
        const results = {};
        
        const currentDraw = data.powerConsumption / data.voltage; // mA
        const capacityInAh = data.batteryCapacity / 1000; // Convert mAh to Ah
        const currentInA = currentDraw / 1000; // Convert mA to A
        
        const theoreticalRuntime = capacityInAh / currentInA; // Hours
        const practicalRuntime = theoreticalRuntime * 0.8; // 80% efficiency factor
        
        const dailyBatteryCycles = data.usageHours / practicalRuntime;
        const batteriesPerDay = Math.ceil(dailyBatteryCycles);
        
        if (data.calculatorType === 'runtime') {
            results.title = 'Battery Runtime Analysis';
            results.primary = `${Utils.formatNumber(practicalRuntime, 1)} hours`;
            results.details = [
                `Theoretical Maximum: ${Utils.formatNumber(theoreticalRuntime, 1)} hours`,
                `Daily Usage: ${Utils.formatNumber(data.usageHours, 1)} hours`,
                `Batteries needed per day: ${batteriesPerDay}`,
                `Current draw: ${Utils.formatNumber(currentDraw, 0)} mA`
            ];
        } else if (data.calculatorType === 'capacity') {
            const requiredCapacity = (data.usageHours * currentInA * 1000) / 0.8; // mAh with efficiency factor
            results.title = 'Required Battery Capacity';
            results.primary = `${Utils.formatNumber(requiredCapacity, 0)} mAh`;
            results.details = [
                `For ${Utils.formatNumber(data.usageHours, 1)} hours of usage`,
                `Current requirement: ${Utils.formatNumber(currentInA * 1000, 0)} mA`,
                `Efficiency factor applied: 80%`,
                `Recommended capacity: ${Utils.formatNumber(requiredCapacity * 1.2, 0)} mAh (20% safety margin)`
            ];
        } else if (data.calculatorType === 'cost') {
            const dailyCost = batteriesPerDay * data.pricePerUnit;
            const weeklyCost = dailyCost * 7;
            const monthlyCost = dailyCost * 30;
            const yearlyCost = dailyCost * 365;
            
            results.title = 'Cost Analysis';
            results.primary = `$${Utils.formatNumber(dailyCost, 2)}/day`;
            results.details = [
                `Weekly cost: $${Utils.formatNumber(weeklyCost, 2)}`,
                `Monthly cost: $${Utils.formatNumber(monthlyCost, 2)}`,
                `Annual cost: $${Utils.formatNumber(yearlyCost, 2)}`,
                `Batteries per day: ${batteriesPerDay} @ $${Utils.formatNumber(data.pricePerUnit, 2)} each`
            ];
        }

        if (data.deviceType === 'smartphone' && practicalRuntime < 12) {
            results.recommendation = "Consider a higher capacity battery or power bank for all-day usage.";
        } else if (data.deviceType === 'laptop' && practicalRuntime < 4) {
            results.recommendation = "Your laptop may need a battery replacement or more efficient power management.";
        } else if (data.deviceType === 'car' && practicalRuntime < 200) {
            results.recommendation = "Consider upgrading to a higher capacity battery pack for extended range.";
        } else {
            results.recommendation = "Your battery configuration appears well-suited for your usage pattern.";
        }

        AppState.calculatorResults = results;
        return results;
    },

    displayResults: function(results) {
        const resultDiv = document.getElementById('calculatorResult');
        const contentDiv = document.getElementById('resultContent');
        
        if (resultDiv && contentDiv) {
            let html = `
                <h4>${results.title}</h4>
                <div class="result-primary">${results.primary}</div>
                <ul class="result-details">
                    ${results.details.map(detail => `<li>${detail}</li>`).join('')}
                </ul>
                <div class="result-recommendation">
                    <strong>Recommendation:</strong> ${results.recommendation}
                </div>
            `;
            
            contentDiv.innerHTML = html;
            resultDiv.classList.add('show');
            resultDiv.scrollIntoView({ behavior: 'smooth' });
        }
    }
};

const SecurityInfo = {
    init: function() {
        const browserPropsDiv = document.getElementById('browserProperties');
        if (browserPropsDiv) {
            this.displayBrowserProperties();
        }
    },

    displayBrowserProperties: function() {
        Utils.safeExecute(() => {
            const properties = [
                { label: 'Browser Name & Version', value: navigator.userAgent.split(' ')[0] + ' ' + this.getBrowserVersion() },
                { label: 'Operating System', value: this.getOperatingSystem() },
                { label: 'Screen Resolution', value: `${screen.width} x ${screen.height}` },
                { label: 'Available Screen Size', value: `${screen.availWidth} x ${screen.availHeight}` },
                { label: 'Color Depth', value: `${screen.colorDepth} bits` },
                { label: 'Time Zone', value: Intl.DateTimeFormat().resolvedOptions().timeZone },
                { label: 'Language', value: navigator.language },
                { label: 'Cookie Enabled', value: navigator.cookieEnabled ? 'Yes' : 'No' },
                { label: 'Online Status', value: navigator.onLine ? 'Online' : 'Offline' },
                { label: 'Platform', value: navigator.platform }
            ];

            const html = properties.map(prop => 
                `<div class="browser-property">
                    <strong>${prop.label}:</strong> ${prop.value}
                </div>`
            ).join('');

            document.getElementById('browserProperties').innerHTML = html;
        }, "Error displaying browser properties");
    },

    getBrowserVersion: function() {
        const ua = navigator.userAgent;
        if (ua.includes('Chrome/')) return ua.split('Chrome/')[1].split(' ')[0];
        if (ua.includes('Firefox/')) return ua.split('Firefox/')[1];
        if (ua.includes('Safari/')) return ua.split('Version/')[1]?.split(' ')[0] || 'Unknown';
        if (ua.includes('Edge/')) return ua.split('Edge/')[1];
        return 'Unknown';
    },

    getOperatingSystem: function() {
        const ua = navigator.userAgent;
        if (ua.includes('Windows')) return 'Windows';
        if (ua.includes('Mac OS')) return 'macOS';
        if (ua.includes('Linux')) return 'Linux';
        if (ua.includes('Android')) return 'Android';
        if (ua.includes('iOS')) return 'iOS';
        return 'Unknown';
    }
};

const ContactForm = {
    init: function() {
        const form = document.getElementById('contactForm');
        if (form) {
            form.addEventListener('submit', this.handleSubmit.bind(this));
            this.setupCheckboxManagement();
        }
    },

    setupCheckboxManagement: function() {
        const checkboxes = document.querySelectorAll('input[name="batteryTypes"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', this.updateBatteryTypesArray.bind(this));
        });
    },

    updateBatteryTypesArray: function() {
        AppState.selectedBatteryTypes = [];
        const checkboxes = document.querySelectorAll('input[name="batteryTypes"]:checked');
        checkboxes.forEach(checkbox => {
            AppState.selectedBatteryTypes.push({
                value: checkbox.value,
                label: checkbox.nextElementSibling.textContent
            });
        });
        console.log('Selected battery types:', AppState.selectedBatteryTypes);
    },

    handleSubmit: function(event) {
        event.preventDefault();
        
        Utils.safeExecute(() => {
            if (this.validateForm()) {
                this.processForm();
            }
        }, "Form submission error occurred");
    },

    validateForm: function() {
        let isValid = true;
        const errors = {};

        const requiredFields = [
            { id: 'fullName', name: 'Full Name' },
            { id: 'email', name: 'Email' },
            { id: 'inquiryType', name: 'Inquiry Type' },
            { id: 'message', name: 'Message' },
            { id: 'terms', name: 'Terms Agreement' }
        ];

        requiredFields.forEach(field => {
            const element = document.getElementById(field.id);
            const value = field.id === 'terms' ? element.checked : element.value.trim();
            
            if (!value) {
                errors[field.id] = `${field.name} is required`;
                isValid = false;
            }
        });

        const email = document.getElementById('email').value.trim();
        if (email && !Utils.validateEmail(email)) {
            errors.email = 'Please enter a valid email address';
            isValid = false;
        }

        // Phone validation (optional but must be valid if provided)
        const phone = document.getElementById('phone').value.trim();
        if (phone && !Utils.validatePhone(phone)) {
            errors.phone = 'Please enter a valid phone number';
            isValid = false;
        }

        // Message length validation
        const message = document.getElementById('message').value.trim();
        if (message && message.length < 10) {
            errors.message = 'Message must be at least 10 characters long';
            isValid = false;
        }

        // Display errors
        this.displayValidationErrors(errors);
        AppState.validationErrors = errors;
        
        return isValid;
    },

    displayValidationErrors: function(errors) {
        // Clear previous errors
        document.querySelectorAll('.error-message').forEach(span => {
            span.textContent = '';
        });
        document.querySelectorAll('.error').forEach(field => {
            field.classList.remove('error');
        });

        // Display new errors
        Object.keys(errors).forEach(fieldId => {
            const field = document.getElementById(fieldId);
            const errorSpan = document.getElementById(fieldId + 'Error');
            
            if (field && errorSpan) {
                field.classList.add('error');
                errorSpan.textContent = errors[fieldId];
            }
        });
    },

    processForm: function() {
        // Simulate form processing
        const formData = this.collectFormData();
        console.log('Processing form with data:', formData);
        
        // Show success message
        const form = document.getElementById('contactForm');
        const successDiv = document.getElementById('formSuccess');
        
        if (form && successDiv) {
            form.style.display = 'none';
            successDiv.classList.add('show');
            successDiv.scrollIntoView({ behavior: 'smooth' });
        }
    },

    collectFormData: function() {
        return {
            fullName: document.getElementById('fullName').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            company: document.getElementById('company').value.trim(),
            inquiryType: document.getElementById('inquiryType').value,
            batteryTypes: AppState.selectedBatteryTypes,
            quantity: document.getElementById('quantity').value,
            urgency: document.getElementById('urgency').value,
            message: document.getElementById('message').value.trim(),
            newsletter: document.getElementById('newsletter').checked,
            terms: document.getElementById('terms').checked,
            timestamp: new Date().toISOString()
        };
    }
};

// Initialize all modules when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    Utils.safeExecute(() => {
        Navigation.init();
        BatteryCalculator.init();
        SecurityInfo.init();
        ContactForm.init();
        
        console.log('Bomb Batteries website initialized successfully!');
    }, "Failed to initialize website");
});

// Handle page visibility changes for security
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        console.log('Page hidden - pausing non-critical operations');
    } else {
        console.log('Page visible - resuming operations');
        // Refresh security info if on security page
        if (window.location.pathname.includes('security.html')) {
            SecurityInfo.displayBrowserProperties();
        }
    }
}); 