// CHANGE THIS TO YOUR GCP PUBLIC IP
const API_URL = "http://34.10.27.200:3000"; 
const CORRECT_PIN = "1080";

// 1. PIN Security
function checkPin() {
    const input = document.getElementById('pin-input').value;
    if (input === CORRECT_PIN) {
        document.getElementById('auth-overlay').classList.add('hidden');
        document.getElementById('app-content').classList.remove('hidden');
        fetchTransactions();
    } else {
        alert("Incorrect PIN");
    }
}

// 2. Fetch Data (Read)
async function fetchTransactions() {
    try {
        const res = await fetch(`${API_URL}/transactions`);
        const data = await res.json();
        renderTable(data);
    } catch (err) {
        console.error("Sync Error:", err);
    }
}

// 3. Render and Calculate Balance
function renderTable(transactions) {
    const list = document.getElementById('transaction-list');
    let balance = 0;
    list.innerHTML = '';

    transactions.forEach(t => {
        const isExpense = t.type === 'Expense';
        balance += isExpense ? -t.amount : t.amount;

        list.innerHTML += `
            <tr>
                <td>${t.date}</td>
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
}

// 4. Add Transaction (Create)
document.getElementById('transaction-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        date: document.getElementById('date').value,
        description: document.getElementById('desc').value,
        category: document.getElementById('cat').value,
        amount: parseFloat(document.getElementById('amt').value),
        type: document.getElementById('type').value
    };

    await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    e.target.reset();
    fetchTransactions();
});

// 5. Delete Transaction (Delete)
async function deleteTransaction(id) {
    if (confirm('Delete this record?')) {
        await fetch(`${API_URL}/transactions/${id}`, { method: 'DELETE' });
        fetchTransactions();
    }
}
