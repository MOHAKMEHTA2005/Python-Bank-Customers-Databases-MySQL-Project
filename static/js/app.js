/* -------------------------------------------------------------
 * AURA BANK CLIENT ENGINE - JAVASCRIPT LOGIC DRIVER
 * SPA view handling, REST API integration, Chart.js,
 * Statement translation and custom dynamic notifications.
 * ------------------------------------------------------------- */

// State Management Globals
let activeTab = 'dashboard';
let activeConfig = null;
let currentCustomers = [];
let distributionChart = null;
let deleteTargetAcc = null;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialise SPA Navigation
    initNavigation();
    
    // 2. Load System Configuration & Start UI
    loadSystemConfig();
    
    // 3. Bind UI Form Events & Actions
    bindEvents();
    
    // 4. Initial Load of Dashboard statistics
    loadDashboardStats();
});

/* ==========================================
 * I. NAVIGATION & VIEW TOGGLING
 * ========================================== */
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabName = item.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    // Update active tab buttons
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.getAttribute('data-tab') === tabName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Update active view visibility with transition
    document.querySelectorAll('.tab-view').forEach(view => {
        view.classList.remove('active');
    });

    const targetView = document.getElementById(`view-${tabName}`);
    if (targetView) {
        targetView.classList.add('active');
    }

    activeTab = tabName;

    // Update page headers dynamically
    const headerTitle = document.getElementById('current-view-title');
    const headerDesc = document.getElementById('current-view-desc');
    
    switch (tabName) {
        case 'dashboard':
            headerTitle.textContent = "Dashboard";
            headerDesc.textContent = "General overview of your bank customer database metrics.";
            loadDashboardStats();
            break;
        case 'customers':
            headerTitle.textContent = "Customer Directory";
            headerDesc.textContent = "Browse, search, edit and remove customer accounts.";
            loadCustomerDirectory();
            break;
        case 'add-customer':
            headerTitle.textContent = "Create Account";
            headerDesc.textContent = "Open a brand new customer registry in the bank database.";
            document.getElementById('customer-form').reset();
            autoGenerateAccountNumber();
            break;
        case 'statement':
            headerTitle.textContent = "Reports & Statements";
            headerDesc.textContent = "Generate high-fidelity official printed reports for active accounts.";
            loadStatementCustomers();
            break;
        case 'settings':
            headerTitle.textContent = "Database Settings";
            headerDesc.textContent = "Change underlying engines between SQLite and MySQL production servers.";
            loadConfigSettings();
            break;
    }
}

/* ==========================================
 * II. REST API CONTROLS (CRUD)
 * ========================================== */

// Loading config
async function loadSystemConfig() {
    try {
        const res = await fetch('/api/config');
        const data = await res.json();
        if (data.status === 'success') {
            activeConfig = data.config;
            updateStatusIndicator(data.active_type);
        }
    } catch (err) {
        showToast("Could not communicate with the backend server.", "error");
        updateStatusIndicator("offline");
    }
}

// Update Database State Badges
function updateStatusIndicator(type) {
    const dot = document.getElementById('status-dot');
    const text = document.getElementById('status-db-text');
    
    dot.className = "status-indicator pulse";
    
    if (type === 'mysql') {
        dot.classList.add('mysql-active');
        text.textContent = "MySQL Relational";
    } else if (type === 'sqlite') {
        text.textContent = "SQLite Local";
    } else {
        dot.className = "status-indicator offline";
        text.textContent = "Offline / Connection Failed";
    }
}

// Load Dashboard Analytics
async function loadDashboardStats() {
    try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        
        if (data.status === 'success') {
            const stats = data.stats;
            
            // Numbers counters
            document.getElementById('stat-total-customers').textContent = stats.total_customers;
            document.getElementById('stat-total-balance').textContent = formatCurrency(stats.total_balance);
            document.getElementById('stat-avg-balance').textContent = formatCurrency(stats.avg_balance);
            
            // Build Recent Table
            const tbody = document.querySelector('#recent-table tbody');
            tbody.innerHTML = '';
            
            if (stats.recent_registrations && stats.recent_registrations.length > 0) {
                stats.recent_registrations.forEach(c => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><strong>${c.accno}</strong></td>
                        <td>${c.cname}</td>
                        <td><span class="badge badge-${getBadgeClass(c.atype)}">${c.atype}</span></td>
                        <td>${formatCurrency(c.Balance)}</td>
                    `;
                    tbody.appendChild(tr);
                });
            } else {
                tbody.innerHTML = `<tr><td colspan="4" class="text-center" style="color: var(--text-muted-dark); padding: 2rem;">No registrations recorded yet.</td></tr>`;
            }
            
            // Draw Chart.js Donut
            renderChart(stats.distribution);
        }
    } catch (err) {
        showToast("Error fetching statistics.", "error");
    }
}

// Load Directory with Filters
async function loadCustomerDirectory() {
    const searchVal = encodeURIComponent(document.getElementById('search-input').value);
    const typeVal = encodeURIComponent(document.getElementById('filter-type').value);
    
    try {
        const res = await fetch(`/api/customers?search=${searchVal}&type=${typeVal}`);
        const data = await res.json();
        
        if (data.status === 'success') {
            currentCustomers = data.customers;
            const tbody = document.querySelector('#customers-table tbody');
            tbody.innerHTML = '';
            
            if (currentCustomers.length > 0) {
                currentCustomers.forEach(c => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><strong>${c.accno}</strong></td>
                        <td>
                            <div style="font-weight: 600; color: #fff;">${c.cname}</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">${c.addr}</div>
                        </td>
                        <td><span class="badge badge-${getBadgeClass(c.atype)}">${c.atype}</span></td>
                        <td style="color: var(--text-muted); font-size: 0.85rem;">
                            <div>📞 ${c.phone}</div>
                            <div>💳 PAN: ${c.pcard} | Aadhaar: ${c.acard}</div>
                        </td>
                        <td style="font-weight: 700; color: var(--success);">${formatCurrency(c.Balance)}</td>
                        <td style="text-align: right;">
                            <div class="action-buttons">
                                <button class="btn-icon btn-icon-view" onclick="generateStatementDirect('${c.accno}')" title="Generate Bank Statement">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                </button>
                                <button class="btn-icon btn-icon-edit" onclick="openEditModal('${c.accno}')" title="Edit Customer Details">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path></svg>
                                </button>
                                <button class="btn-icon btn-icon-delete" onclick="openDeleteModal('${c.accno}', '${c.cname}')" title="Delete Account Record">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                </button>
                            </div>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            } else {
                tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="color: var(--text-muted); padding: 3rem;">No customer records match your filter criteria.</td></tr>`;
            }
        }
    } catch (err) {
        showToast("Error loading customer records.", "error");
    }
}

// Auto Generation of Account Number (logical maximum incremental)
async function autoGenerateAccountNumber() {
    try {
        const res = await fetch('/api/customers');
        const data = await res.json();
        if (data.status === 'success') {
            const list = data.customers;
            let maxAcc = 1000;
            list.forEach(c => {
                const numeric = parseInt(c.accno);
                if (!isNaN(numeric) && numeric > maxAcc) {
                    maxAcc = numeric;
                }
            });
            document.getElementById('reg-accno').value = maxAcc + 1;
        }
    } catch (e) {
        document.getElementById('reg-accno').value = Math.floor(100000 + Math.random() * 900000);
    }
}

/* ==========================================
 * III. EVENT BINDING & HANDLERS
 * ========================================== */
function bindEvents() {
    // Filter directory list dynamically
    document.getElementById('search-input').addEventListener('input', loadCustomerDirectory);
    document.getElementById('filter-type').addEventListener('change', loadCustomerDirectory);

    // Auto button trigger
    document.getElementById('btn-generate-acc').addEventListener('click', autoGenerateAccountNumber);

    // Form registrations submit
    document.getElementById('customer-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const payload = {
            accno: document.getElementById('reg-accno').value,
            cname: document.getElementById('reg-cname').value,
            addr: document.getElementById('reg-addr').value,
            phone: document.getElementById('reg-phone').value,
            atype: document.getElementById('reg-atype').value,
            pcard: document.getElementById('reg-pcard').value,
            acard: document.getElementById('reg-acard').value,
            balance: parseFloat(document.getElementById('reg-balance').value)
        };
        
        try {
            const res = await fetch('/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            
            if (res.status === 201) {
                showToast("Customer account opened successfully!", "success");
                switchTab('customers');
            } else {
                showToast(data.message || "Failed to create account.", "error");
            }
        } catch (err) {
            showToast("Server request failed.", "error");
        }
    });

    // Modal Cancellations
    document.getElementById('btn-close-edit-modal').addEventListener('click', () => toggleModal('edit-modal', false));
    document.getElementById('btn-cancel-edit').addEventListener('click', () => toggleModal('edit-modal', false));
    document.getElementById('btn-cancel-delete').addEventListener('click', () => toggleModal('delete-modal', false));

    // Confirm Editing Details
    document.getElementById('edit-customer-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const accno = document.getElementById('edit-accno').value;
        const payload = {
            cname: document.getElementById('edit-cname').value,
            addr: document.getElementById('edit-addr').value,
            phone: document.getElementById('edit-phone').value,
            atype: document.getElementById('edit-atype').value,
            pcard: document.getElementById('edit-pcard').value,
            acard: document.getElementById('edit-acard').value,
            balance: parseFloat(document.getElementById('edit-balance').value)
        };
        
        try {
            const res = await fetch(`/api/customers/${accno}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            
            if (data.status === 'success') {
                showToast("Account details updated successfully!", "success");
                toggleModal('edit-modal', false);
                loadCustomerDirectory();
            } else {
                showToast(data.message || "Update failed.", "error");
            }
        } catch (err) {
            showToast("Server request failed.", "error");
        }
    });

    // Confirm Delete Target Action
    document.getElementById('btn-confirm-delete').addEventListener('click', async () => {
        if (!deleteTargetAcc) return;
        
        try {
            const res = await fetch(`/api/customers/${deleteTargetAcc}`, { method: 'DELETE' });
            const data = await res.json();
            
            if (data.status === 'success') {
                showToast("Customer record deleted successfully.", "success");
                toggleModal('delete-modal', false);
                loadCustomerDirectory();
            } else {
                showToast(data.message || "Deletion failed.", "error");
            }
        } catch (err) {
            showToast("Server request failed.", "error");
        }
    });

    // Database Configuration switching toggling fields
    const dbToggles = document.querySelectorAll('input[name="db_type_toggle"]');
    dbToggles.forEach(t => {
        t.addEventListener('change', () => {
            const mysqlSect = document.getElementById('mysql-credentials-section');
            if (t.value === 'mysql') {
                mysqlSect.classList.remove('hidden-element');
            } else {
                mysqlSect.classList.add('hidden-element');
            }
        });
    });

    // DB Settings "Test Connection"
    document.getElementById('btn-test-connection').addEventListener('click', async () => {
        const activeEngine = document.querySelector('input[name="db_type_toggle"]:checked').value;
        const payload = {
            type: activeEngine,
            host: document.getElementById('db-host').value,
            user: document.getElementById('db-user').value,
            passwd: document.getElementById('db-passwd').value,
            database: document.getElementById('db-name').value
        };
        
        showToast("Testing connection, please wait...", "info");
        
        try {
            const res = await fetch('/api/config/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            
            if (data.status === 'success') {
                showToast(data.message, "success");
            } else {
                showToast(data.message || "Connection failed.", "error");
            }
        } catch (err) {
            showToast("Test request failed.", "error");
        }
    });

    // Save Active Configurations settings
    document.getElementById('db-config-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const activeEngine = document.querySelector('input[name="db_type_toggle"]:checked').value;
        const payload = {
            type: activeEngine,
            host: document.getElementById('db-host').value,
            user: document.getElementById('db-user').value,
            passwd: document.getElementById('db-passwd').value,
            database: document.getElementById('db-name').value
        };
        
        try {
            const res = await fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            
            if (data.status === 'success') {
                showToast(data.message, "success");
                loadSystemConfig();
                switchTab('dashboard');
            } else if (data.status === 'warning') {
                showToast(data.message, "warning");
                loadSystemConfig();
            } else {
                showToast(data.message || "Save failed.", "error");
            }
        } catch (err) {
            showToast("Server request failed.", "error");
        }
    });

    // Statement dropdown generator
    document.getElementById('btn-generate-statement').addEventListener('click', () => {
        const accno = document.getElementById('statement-customer-select').value;
        if (!accno) {
            showToast("Please select a customer first.", "warning");
            return;
        }
        renderStatement(accno);
    });
}

/* ==========================================
 * IV. MODAL TRIGGER CONTROLLER
 * ========================================== */
function toggleModal(id, show) {
    const modal = document.getElementById(id);
    if (show) {
        modal.classList.add('active');
    } else {
        modal.classList.remove('active');
    }
}

// Open Edit Mode modal with prefilled data
async function openEditModal(accno) {
    try {
        const res = await fetch(`/api/customers/${accno}`);
        const data = await res.json();
        
        if (data.status === 'success') {
            const c = data.customer;
            document.getElementById('edit-accno').value = c.accno;
            document.getElementById('edit-accno-display').value = c.accno;
            document.getElementById('edit-cname').value = c.cname;
            document.getElementById('edit-addr').value = c.addr;
            document.getElementById('edit-phone').value = c.phone;
            document.getElementById('edit-atype').value = c.atype;
            document.getElementById('edit-pcard').value = c.pcard;
            document.getElementById('edit-acard').value = c.acard;
            document.getElementById('edit-balance').value = c.Balance;
            
            toggleModal('edit-modal', true);
        } else {
            showToast("Failed to fetch customer data.", "error");
        }
    } catch (err) {
        showToast("Error retrieving data.", "error");
    }
}

// Open Delete Confirm Alert Modal
function openDeleteModal(accno, name) {
    deleteTargetAcc = accno;
    document.getElementById('delete-customer-name').textContent = name;
    document.getElementById('delete-customer-acc').textContent = accno;
    toggleModal('delete-modal', true);
}

/* ==========================================
 * V. DATABASE CONNECTION FIELDS
 * ========================================== */
async function loadConfigSettings() {
    try {
        const res = await fetch('/api/config');
        const data = await res.json();
        if (data.status === 'success') {
            const c = data.config;
            
            // Check matching radio toggle
            const r = document.querySelector(`input[name="db_type_toggle"][value="${c.type}"]`);
            if (r) {
                r.checked = true;
                r.dispatchEvent(new Event('change'));
            }
            
            // Prefill credential entries
            document.getElementById('db-host').value = c.host || 'localhost';
            document.getElementById('db-user').value = c.user || 'root';
            document.getElementById('db-passwd').value = c.passwd || '';
            document.getElementById('db-name').value = c.database || 'Bank_Customers_Database';
        }
    } catch (err) {
        showToast("Error loading active configurations.", "error");
    }
}

/* ==========================================
 * VI. HIGH-FIDELITY PRINTABLE STATEMENTS
 * ========================================== */
async function loadStatementCustomers() {
    try {
        const res = await fetch('/api/customers');
        const data = await res.json();
        if (data.status === 'success') {
            const select = document.getElementById('statement-customer-select');
            select.innerHTML = '<option value="" disabled selected>Select Customer account...</option>';
            data.customers.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.accno;
                opt.textContent = `${c.cname} (${c.accno}) - ₹${parseFloat(c.Balance).toLocaleString()}`;
                select.appendChild(opt);
            });
        }
    } catch (err) {
        showToast("Could not load options for statement generator.", "error");
    }
}

// Directly jump to statement tab
function generateStatementDirect(accno) {
    switchTab('statement');
    // We wait a tiny bit to let options render
    setTimeout(() => {
        document.getElementById('statement-customer-select').value = accno;
        renderStatement(accno);
    }, 150);
}

async function renderStatement(accno) {
    try {
        const res = await fetch(`/api/customers/${accno}`);
        const data = await res.json();
        
        if (data.status === 'success') {
            const c = data.customer;
            
            document.getElementById('stmt-accno').textContent = c.accno;
            document.getElementById('stmt-cname').textContent = c.cname;
            document.getElementById('stmt-addr').textContent = c.addr;
            document.getElementById('stmt-atype').textContent = c.atype;
            document.getElementById('stmt-pcard').textContent = c.pcard;
            document.getElementById('stmt-acard').textContent = c.acard;
            document.getElementById('stmt-balance').textContent = formatCurrency(c.Balance);
            document.getElementById('stmt-balance-words').textContent = translateNumberToWords(c.Balance) + " Rupees Only";
            
            // Format today's date
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            document.getElementById('stmt-current-date').textContent = new Date().toLocaleDateString('en-IN', options);
            
            // Show container
            document.getElementById('statement-output-container').classList.remove('hidden-element');
        } else {
            showToast("Failed to fetch statement details.", "error");
        }
    } catch (e) {
        showToast("Server rendering error.", "error");
    }
}

/* ==========================================
 * VII. CUSTOM CHART RENDERING (CHART.JS)
 * ========================================== */
function renderChart(distribution) {
    const ctx = document.getElementById('distribution-chart');
    if (!ctx) return;
    
    const types = Object.keys(distribution);
    const counts = Object.values(distribution);
    
    // Toggle placeholder text if empty database
    const noData = document.getElementById('no-chart-data');
    if (types.length === 0) {
        noData.classList.remove('hidden-element');
        ctx.classList.add('hidden-element');
        return;
    } else {
        noData.classList.add('hidden-element');
        ctx.classList.remove('hidden-element');
    }
    
    // Destroy previous Chart instance to re-initialize
    if (distributionChart) {
        distributionChart.destroy();
    }
    
    const colors = {
        'Saving': '#6366f1',
        'Current': '#f59e0b',
        'Regular': '#0ea5e9',
        'Fixed Deposit': '#10b981',
        'Demat': '#f43f5e'
    };
    
    const backgroundColors = types.map(t => colors[t] || '#64748b');
    
    distributionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: types,
            datasets: [{
                data: counts,
                backgroundColor: backgroundColors,
                borderWidth: 2,
                borderColor: '#1e293b',
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#94a3b8',
                        font: {
                            family: 'Outfit',
                            size: 11
                        },
                        padding: 15
                    }
                }
            },
            cutout: '65%'
        }
    });
}

/* ==========================================
 * VIII. UTILITY FUNCTIONS (WORDS/CURRENCY)
 * ========================================== */

// Indian rupee locale formatting
function formatCurrency(value) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
    }).format(value);
}

function getBadgeClass(type) {
    switch (type) {
        case 'Saving': return 'saving';
        case 'Current': return 'current';
        case 'Regular': return 'regular';
        case 'Fixed Deposit': return 'fixed';
        case 'Demat': return 'demat';
        default: return 'saving';
    }
}

// Convert numbers into standard words for bank statements
function translateNumberToWords(amount) {
    let num = Math.floor(amount);
    if (num === 0) return "Zero";
    
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
                  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    function helper(n) {
        if (n < 20) return ones[n];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
        if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + helper(n % 100) : '');
        return '';
    }
    
    let words = '';
    
    if (Math.floor(num / 10000000) > 0) {
        words += helper(Math.floor(num / 10000000)) + ' Crore ';
        num %= 10000000;
    }
    if (Math.floor(num / 100000) > 0) {
        words += helper(Math.floor(num / 100000)) + ' Lakh ';
        num %= 100000;
    }
    if (Math.floor(num / 1000) > 0) {
        words += helper(Math.floor(num / 1000)) + ' Thousand ';
        num %= 1000;
    }
    if (num > 0) {
        words += helper(num);
    }
    
    return words.trim();
}

// Custom Toast popup system
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-message">${message}</span>
        <button class="toast-close">&times;</button>
    `;
    
    container.appendChild(toast);
    
    // Wire close action
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        removeToast(toast);
    });
    
    // Auto remove after 4.5 seconds
    setTimeout(() => {
        removeToast(toast);
    }, 4500);
}

function removeToast(toast) {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px) scale(0.9)';
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 300);
}
