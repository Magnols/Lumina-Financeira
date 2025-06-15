// Lumina Financeira - JavaScript Application Logic
class LuminaFinanceira {
    constructor() {
        this.currentSection = 'dashboard';
        this.charts = {};
        
        // Initial data from the provided JSON
        this.data = {
            transactions: [
                {
                    id: 1,
                    date: "2025-06-12",
                    description: "Supermercado",
                    category: "Alimentação",
                    amount: -150.50,
                    type: "expense"
                },
                {
                    id: 2,
                    date: "2025-06-11",
                    description: "Salário",
                    category: "Renda",
                    amount: 3500.00,
                    type: "income"
                },
                {
                    id: 3,
                    date: "2025-06-10",
                    description: "Transporte",
                    category: "Transporte",
                    amount: -45.00,
                    type: "expense"
                },
                {
                    id: 4,
                    date: "2025-06-09",
                    description: "Farmácia",
                    category: "Saúde",
                    amount: -78.90,
                    type: "expense"
                }
            ],
            goals: [
                {
                    id: 1,
                    name: "Casa Própria",
                    target: 50000.00,
                    current: 12500.00,
                    deadline: "2026-12-31",
                    category: "Moradia"
                },
                {
                    id: 2,
                    name: "Viagem Europa",
                    target: 8000.00,
                    current: 2400.00,
                    deadline: "2025-12-31",
                    category: "Lazer"
                },
                {
                    id: 3,
                    name: "Reserva Emergência",
                    target: 15000.00,
                    current: 8750.00,
                    deadline: "2025-09-30",
                    category: "Emergência"
                }
            ],
            accounts: [
                {
                    name: "Conta Corrente",
                    balance: 2500.00,
                    bank: "Banco do Brasil"
                },
                {
                    name: "Poupança",
                    balance: 8750.00,
                    bank: "Caixa"
                },
                {
                    name: "Investimentos",
                    balance: 15000.00,
                    bank: "XP Investimentos"
                }
            ],
            monthlyData: {
                income: 3500.00,
                expenses: 2100.00,
                savings: 1400.00
            },
            categories: [
                "Alimentação",
                "Transporte", 
                "Moradia",
                "Saúde",
                "Lazer",
                "Educação",
                "Investimentos",
                "Outros"
            ]
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupAccessibility();
        this.populateInitialData();
        this.initializeCharts();
        this.setCurrentDate();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.currentTarget.getAttribute('data-section');
                this.showSection(section);
            });
        });

        // Forms
        const transactionForm = document.getElementById('transactionForm');
        if (transactionForm) {
            transactionForm.addEventListener('submit', (e) => this.handleTransactionSubmit(e));
        }

        const goalForm = document.getElementById('goalForm');
        if (goalForm) {
            goalForm.addEventListener('submit', (e) => this.handleGoalSubmit(e));
        }

        // Filters
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => this.filterTransactions(e.target.value));
        }

        // Dark mode toggles
        document.getElementById('darkModeToggle')?.addEventListener('click', () => this.toggleDarkMode());
        document.getElementById('darkModeToggleDesktop')?.addEventListener('click', () => this.toggleDarkMode());
        document.getElementById('darkModeSwitch')?.addEventListener('change', (e) => this.toggleDarkMode(e.target.checked));

        // Accessibility settings
        document.getElementById('fontSizeSelect')?.addEventListener('change', (e) => this.changeFontSize(e.target.value));
        document.getElementById('highContrastSwitch')?.addEventListener('change', (e) => this.toggleHighContrast(e.target.checked));
    }

    setupAccessibility() {
        // Set initial accessibility states
        const darkModeSwitch = document.getElementById('darkModeSwitch');
        const savedTheme = localStorage.getItem('theme') || 'light';
        
        if (savedTheme === 'dark') {
            this.toggleDarkMode(true);
            if (darkModeSwitch) darkModeSwitch.checked = true;
        }

        const savedFontSize = localStorage.getItem('fontSize') || 'medium';
        this.changeFontSize(savedFontSize);
        
        const fontSizeSelect = document.getElementById('fontSizeSelect');
        if (fontSizeSelect) fontSizeSelect.value = savedFontSize;
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.add('d-none');
        });

        // Show selected section
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.remove('d-none');
        }

        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        document.querySelectorAll(`[data-section="${sectionName}"]`).forEach(link => {
            link.classList.add('active');
        });

        this.currentSection = sectionName;

        // Refresh charts if entering reports section
        if (sectionName === 'reports') {
            setTimeout(() => this.initializeCharts(), 100);
        }

        // Close mobile menu
        const navbarCollapse = document.getElementById('navbarNav');
        if (navbarCollapse && navbarCollapse.classList.contains('show')) {
            const bsCollapse = new bootstrap.Collapse(navbarCollapse);
            bsCollapse.hide();
        }
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(Math.abs(amount));
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('pt-BR');
    }

    populateInitialData() {
        this.updateDashboard();
        this.populateTransactions();
        this.populateGoals();
        this.setupCategoryFilters();
    }

    updateDashboard() {
        // Calculate totals
        const totalBalance = this.data.accounts.reduce((sum, account) => sum + account.balance, 0);
        const monthlyIncome = this.data.monthlyData.income;
        const monthlyExpenses = this.data.monthlyData.expenses;
        const availableToInvest = monthlyIncome - monthlyExpenses;

        // Update dashboard cards
        document.getElementById('totalBalance').textContent = this.formatCurrency(totalBalance);

        // Populate recent transactions
        this.populateRecentTransactions();
    }

    populateRecentTransactions() {
        const container = document.getElementById('recentTransactions');
        if (!container) return;

        const recentTransactions = this.data.transactions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        container.innerHTML = recentTransactions.map(transaction => `
            <div class="list-group-item transaction-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <div class="fw-medium">${transaction.description}</div>
                        <small class="text-muted">
                            <span class="category-badge ${transaction.category.toLowerCase().replace(' ', '').replace('ã', 'a').replace('ç', 'c')}">${transaction.category}</span>
                            • ${this.formatDate(transaction.date)}
                        </small>
                    </div>
                    <div class="transaction-amount ${transaction.type}">
                        ${transaction.type === 'income' ? '+' : ''}${this.formatCurrency(transaction.amount)}
                    </div>
                </div>
            </div>
        `).join('');
    }

    populateTransactions() {
        const container = document.getElementById('transactionsList');
        if (!container) return;

        const sortedTransactions = this.data.transactions
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        container.innerHTML = sortedTransactions.map(transaction => `
            <div class="transaction-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="flex-grow-1">
                        <div class="fw-medium">${transaction.description}</div>
                        <div class="small text-muted mt-1">
                            <span class="category-badge ${transaction.category.toLowerCase().replace(' ', '').replace('ã', 'a').replace('ç', 'c')}">${transaction.category}</span>
                            <span class="ms-2">${this.formatDate(transaction.date)}</span>
                        </div>
                    </div>
                    <div class="text-end">
                        <div class="transaction-amount ${transaction.type}">
                            ${transaction.type === 'income' ? '+' : ''}${this.formatCurrency(transaction.amount)}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    populateGoals() {
        const container = document.getElementById('goalsList');
        if (!container) return;

        container.innerHTML = this.data.goals.map(goal => {
            const progress = (goal.current / goal.target) * 100;
            const daysLeft = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));
            
            return `
                <div class="col-12 col-md-6 col-lg-4 mb-4">
                    <div class="card h-100 border-0 shadow-sm">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-3">
                                <h5 class="card-title mb-0">${goal.name}</h5>
                                <span class="badge bg-primary">${goal.category}</span>
                            </div>
                            
                            <div class="mb-3">
                                <div class="d-flex justify-content-between mb-1">
                                    <small class="text-muted">Progresso</small>
                                    <small class="fw-medium">${progress.toFixed(1)}%</small>
                                </div>
                                <div class="progress" style="height: 8px;">
                                    <div class="progress-bar bg-success" role="progressbar" 
                                         style="width: ${progress}%" 
                                         aria-valuenow="${progress}" 
                                         aria-valuemin="0" 
                                         aria-valuemax="100">
                                    </div>
                                </div>
                            </div>
                            
                            <div class="row text-center">
                                <div class="col-6">
                                    <div class="small text-muted">Atual</div>
                                    <div class="fw-medium">${this.formatCurrency(goal.current)}</div>
                                </div>
                                <div class="col-6">
                                    <div class="small text-muted">Meta</div>
                                    <div class="fw-medium">${this.formatCurrency(goal.target)}</div>
                                </div>
                            </div>
                            
                            <div class="mt-3 text-center">
                                <small class="text-muted">
                                    ${daysLeft > 0 ? `${daysLeft} dias restantes` : 'Prazo vencido'}
                                </small>
                                <div class="small text-muted">até ${this.formatDate(goal.deadline)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    setupCategoryFilters() {
        const categoryFilter = document.getElementById('categoryFilter');
        if (!categoryFilter) return;

        const categories = [...new Set(this.data.transactions.map(t => t.category))];
        
        categoryFilter.innerHTML = '<option value="">Todas as categorias</option>' +
            categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    }

    handleTransactionSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const transaction = {
            id: Date.now(),
            description: document.getElementById('transactionDescription').value,
            category: document.getElementById('transactionCategory').value,
            amount: parseFloat(document.getElementById('transactionAmount').value),
            type: document.getElementById('transactionType').value,
            date: document.getElementById('transactionDate').value
        };

        // Adjust amount for expenses
        if (transaction.type === 'expense') {
            transaction.amount = -Math.abs(transaction.amount);
        }

        this.data.transactions.push(transaction);
        
        // Update UI
        this.populateTransactions();
        this.populateRecentTransactions();
        this.setupCategoryFilters();
        
        // Reset form
        e.target.reset();
        
        // Show success message
        this.showNotification('Transação adicionada com sucesso!', 'success');
    }

    handleGoalSubmit(e) {
        e.preventDefault();
        
        const goal = {
            id: Date.now(),
            name: document.getElementById('goalName').value,
            category: document.getElementById('goalCategory').value,
            target: parseFloat(document.getElementById('goalTarget').value),
            current: parseFloat(document.getElementById('goalCurrent').value),
            deadline: document.getElementById('goalDeadline').value
        };

        this.data.goals.push(goal);
        
        // Update UI
        this.populateGoals();
        
        // Reset form
        e.target.reset();
        
        // Show success message
        this.showNotification('Meta criada com sucesso!', 'success');
    }

    filterTransactions(category) {
        const container = document.getElementById('transactionsList');
        if (!container) return;

        let filteredTransactions = this.data.transactions;
        
        if (category) {
            filteredTransactions = this.data.transactions.filter(t => t.category === category);
        }

        const sortedTransactions = filteredTransactions
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        container.innerHTML = sortedTransactions.map(transaction => `
            <div class="transaction-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="flex-grow-1">
                        <div class="fw-medium">${transaction.description}</div>
                        <div class="small text-muted mt-1">
                            <span class="category-badge ${transaction.category.toLowerCase().replace(' ', '').replace('ã', 'a').replace('ç', 'c')}">${transaction.category}</span>
                            <span class="ms-2">${this.formatDate(transaction.date)}</span>
                        </div>
                    </div>
                    <div class="text-end">
                        <div class="transaction-amount ${transaction.type}">
                            ${transaction.type === 'income' ? '+' : ''}${this.formatCurrency(transaction.amount)}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    initializeCharts() {
        this.createCategoryChart();
        this.createMonthlyChart();
        this.createCashFlowChart();
    }

    createCategoryChart() {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;

        if (this.charts.categoryChart) {
            this.charts.categoryChart.destroy();
        }

        const expenses = this.data.transactions.filter(t => t.type === 'expense');
        const categoryData = {};
        
        expenses.forEach(transaction => {
            const category = transaction.category;
            categoryData[category] = (categoryData[category] || 0) + Math.abs(transaction.amount);
        });

        const colors = ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545', '#D2BA4C', '#964325'];

        this.charts.categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categoryData),
                datasets: [{
                    data: Object.values(categoryData),
                    backgroundColor: colors.slice(0, Object.keys(categoryData).length),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    createMonthlyChart() {
        const ctx = document.getElementById('monthlyChart');
        if (!ctx) return;

        if (this.charts.monthlyChart) {
            this.charts.monthlyChart.destroy();
        }

        // Sample monthly data
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
        const income = [3200, 3400, 3300, 3500, 3600, 3500];
        const expenses = [2100, 2300, 2000, 2200, 2150, 2100];

        this.charts.monthlyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'Receitas',
                    data: income,
                    borderColor: '#1FB8CD',
                    backgroundColor: 'rgba(31, 184, 205, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Despesas',
                    data: expenses,
                    borderColor: '#B4413C',
                    backgroundColor: 'rgba(180, 65, 60, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'R$ ' + value.toLocaleString('pt-BR');
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
    }

    createCashFlowChart() {
        const ctx = document.getElementById('cashFlowChart');
        if (!ctx) return;

        if (this.charts.cashFlowChart) {
            this.charts.cashFlowChart.destroy();
        }

        // Sample cash flow data
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
        const cashFlow = [1100, 1100, 1300, 1300, 1450, 1400];

        this.charts.cashFlowChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [{
                    label: 'Fluxo de Caixa (R$)',
                    data: cashFlow,
                    backgroundColor: '#1FB8CD',
                    borderColor: '#1FB8CD',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'R$ ' + value.toLocaleString('pt-BR');
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    toggleDarkMode(force = null) {
        const body = document.body;
        const isDark = force !== null ? force : !body.hasAttribute('data-theme') || body.getAttribute('data-theme') === 'light';
        
        if (isDark) {
            body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            body.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        }

        // Update button icons
        const moonIcons = document.querySelectorAll('#darkModeToggle i, #darkModeToggleDesktop i');
        moonIcons.forEach(icon => {
            icon.className = isDark ? 'bi bi-sun' : 'bi bi-moon';
        });

        // Update charts with new theme
        if (this.currentSection === 'reports') {
            setTimeout(() => this.initializeCharts(), 100);
        }
    }

    changeFontSize(size) {
        document.body.setAttribute('data-font-size', size);
        localStorage.setItem('fontSize', size);
    }

    toggleHighContrast(enabled) {
        if (enabled) {
            document.body.setAttribute('data-contrast', 'high');
        } else {
            document.body.removeAttribute('data-contrast');
        }
        localStorage.setItem('highContrast', enabled);
    }

    setCurrentDate() {
        const dateInput = document.getElementById('transactionDate');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.value = today;
        }

        const goalDeadlineInput = document.getElementById('goalDeadline');
        if (goalDeadlineInput) {
            const nextYear = new Date();
            nextYear.setFullYear(nextYear.getFullYear() + 1);
            goalDeadlineInput.min = new Date().toISOString().split('T')[0];
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} position-fixed top-0 end-0 m-3`;
        notification.style.zIndex = '9999';
        notification.style.minWidth = '300px';
        notification.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bi bi-${type === 'success' ? 'check-circle' : 'info-circle'} me-2"></i>
                ${message}
                <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert"></button>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto-dismiss after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.luminaApp = new LuminaFinanceira();
});