// REPLACE THIS IP WITH YOUR GOOGLE CLOUD EXTERNAL IP
const API_URL = "http://34.10.27.200:3000"; 
const CORRECT_PIN = "1234";

let myChart = null;

// 1. PIN Check
function checkPin() {
    const input = document.getElementById('pin-input').value;
    if (input === CORRECT_PIN) {
        document.getElementById('auth-overlay').classList.add('hidden');
        document.getElementById('app-content').classList.remove('hidden');
        fetchTransactions(); // Load data only after unlock
    } else {
        alert("Incorrect PIN");
    }
}

// 2. Fetch Data from Server
async function fetchTransactions() {
    try {
        const res = await fetch(`${API_URL}/transactions`);
        const data = await res.json();
        renderDashboard(data);
    } catch (err) {
        console.error("Error fetching data:", err);
        alert("Could not connect to server. Check Console.");
    }
}

// 3. Render Table, Balance, and Chart
function renderDashboard(transactions) {
    const list = document.getElementById('transaction-list');
    let balance = 0;
    const expenseCategories = {}; // For Chart
    
    list.innerHTML = '';

    transactions.forEach(t => {
        const isExpense = t.type === 'Expense';
        
        // Math Logic
        balance += isExpense ? -t.amount : t.amount;

        // Chart Logic (Only chart expenses)
        if (isExpense) {
            expenseCategories[t.category] = (expenseCategories[t.category] || 0) + t.amount;
        }

        // Table HTML
        list.innerHTML += `
            <tr>
                <td>${t.date} ${t.is_recurring ? '🔄' : ''}</td>
                <td><strong>${t.description}</strong></td>
                <td><span class="badge bg-secondary">${t.category}</span></td>
                <td class="${isExpense ? 'amount-neg' : 'amount-pos'}">
                    ${isExpense ? '-' : '+'}$${t.amount.toFixed(2)}
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteTransaction(${t.id})">Delete</button>
                </td>
            </tr>
        `;
    });

    // Update Balance Text
    document.getElementById('total-balance').innerText = `$${balance.toFixed(2)}`;
    
    // Draw Chart
    updateChart(expenseCategories);
}

// 4. Chart Logic
function updateChart(data) {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    
    // If a chart already exists, destroy it so we don't draw on top of it
    if (myChart) myChart.destroy();

    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(data),
            datasets: [{
                data: Object.values(data),
                backgroundColor: [
                    '#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff', '#ff9f40'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right' }
            }
        }
    });
}

// 5. Add Transaction
document.getElementById('transaction-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const payload = {
        date: document.getElementById('date').value,
        description: document.getElementById('desc').value,
        category: document.getElementById('cat').value,
        amount: parseFloat(document.getElementById('amt').value),
        type: document.getElementById('type').value,
        is_recurring: document.getElementById('recurring').checked
    };

    try {
        const res = await fetch(`${API_URL}/transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            e.target.reset(); // Clear form
            fetchTransactions(); // Refresh list
        } else {
            alert("Server Error");
        }
    } catch (err) {
        alert("Network Error: Enable 'Insecure Content' in browser settings.");
    }
});

// 6. Delete Transaction
async function deleteTransaction(id) {
    if (confirm('Delete this item?')) {
        await fetch(`${API_URL}/transactions/${id}`, { method: 'DELETE' });
        fetchTransactions();
    }
}
