const API_URL = "http://34.10.27.200:3000"; // Ensure this matches your External IP
const CORRECT_PIN = "1234";
let myChart = null;

function checkPin() {
    const input = document.getElementById('pin-input').value;
    if (input === CORRECT_PIN) {
        document.getElementById('auth-overlay').classList.add('hidden');
        document.getElementById('app-content').classList.remove('hidden');
        fetchTransactions();
    } else {
        alert("Access Denied");
    }
}

async function fetchTransactions() {
    try {
        const res = await fetch(`${API_URL}/transactions`);
        const data = await res.json();
        renderData(data);
    } catch (err) {
        console.error("Sync Error:", err);
    }
}

function renderData(transactions) {
    const list = document.getElementById('transaction-list');
    let balance = 0;
    const categories = {};
    list.innerHTML = '';

    transactions.forEach(t => {
        const isExpense = t.type === 'Expense';
        balance += isExpense ? -t.amount : t.amount;

        // Collect chart data
        if (isExpense) {
            categories[t.category] = (categories[t.category] || 0) + t.amount;
        }

        list.innerHTML += `
            <tr>
                <td>${t.date} ${t.is_recurring ? '🔄' : ''}</td>
                <td>${t.description}</td>
                <td><span class="badge bg-secondary">${t.category}</span></td>
                <td class="${isExpense ? 'text-danger' : 'text-success'}">
                    ${isExpense ? '-' : '+'}$${t.amount.toFixed(2)}
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteTransaction(${t.id})">Delete</button>
                </td>
            </tr>
        `;
    });

    document.getElementById('total-balance').innerText = `$${balance.toFixed(2)}`;
    updateChart(categories);
}

function updateChart(categoryData) {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    if (myChart) myChart.destroy();

    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categoryData),
            datasets: [{
                data: Object.values(categoryData),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
            }]
        },
        options: {
            plugins: { title: { display: true, text: 'Spending Breakdown' } },
            maintainAspectRatio: false
        }
    });
}

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

    await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    e.target.reset();
    fetchTransactions();
});

async function deleteTransaction(id) {
    if (confirm('Delete?')) {
        await fetch(`${API_URL}/transactions/${id}`, { method: 'DELETE' });
        fetchTransactions();
    }
}
