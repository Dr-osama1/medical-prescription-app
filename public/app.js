const state = {
  medicines: [],
  patients: [],
  prescriptions: []
};

const medicineSelect = document.getElementById('medicineSelect');
const patientSelect = document.getElementById('patientSelect');
const doseResult = document.getElementById('doseResult');
const patientList = document.getElementById('patientList');
const medicineList = document.getElementById('medicineList');
const prescriptionList = document.getElementById('prescriptionList');
const prescriptionPatientSelect = document.getElementById('prescriptionPatientSelect');
const prescriptionMedicineSelect = document.getElementById('prescriptionMedicineSelect');

const formatDose = (value) => `${Math.round(value)} mg`;

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${url}`);
  }
  return response.json();
}

async function loadData() {
  const [medicines, patients, prescriptions] = await Promise.all([
    fetchJson('/api/medicines'),
    fetchJson('/api/patients'),
    fetchJson('/api/prescriptions')
  ]);

  state.medicines = medicines;
  state.patients = patients;
  state.prescriptions = prescriptions;

  renderMedicineSelect();
  renderPatientSelect();
  renderMedicineCards();
  renderPatientCards();
  renderPrescriptionCards();
}

function renderMedicineSelect() {
  const options = state.medicines
    .map((medicine) => `<option value="${medicine.id}">${medicine.name} - ${medicine.strength}</option>`)
    .join('');

  medicineSelect.innerHTML = options;
  prescriptionMedicineSelect.innerHTML = options;
}

function renderPatientSelect() {
  const options = state.patients
    .map((patient) => `<option value="${patient.id}">${patient.name} (${patient.age} yrs)</option>`)
    .join('');

  patientSelect.innerHTML = options;
  prescriptionPatientSelect.innerHTML = options;
}

function renderMedicineCards() {
  medicineList.innerHTML = state.medicines
    .map(
      (medicine) => `
        <article class="medicine-card">
          <h3>${escapeHtml(medicine.name)}</h3>
          <div class="medicine-meta">
            <div><strong>Brand:</strong> ${escapeHtml(medicine.brand)}</div>
            <div><strong>Strength:</strong> ${escapeHtml(medicine.strength)}</div>
            <div><strong>Form:</strong> ${escapeHtml(medicine.form)}</div>
            <div><strong>Typical dose:</strong> ${escapeHtml(medicine.standardDosePerKg)} ${escapeHtml(medicine.unit)}</div>
          </div>
          <div class="badge">${escapeHtml(medicine.category)}</div>
        </article>
      `
    )
    .join('');
}

function renderPatientCards() {
  patientList.innerHTML = state.patients
    .map(
      (patient) => `
        <article class="patient-card">
          <h3>${escapeHtml(patient.name)}</h3>
          <div class="patient-meta">
            <div>Age: ${escapeHtml(patient.age)} yrs</div>
            <div>Weight: ${escapeHtml(patient.weightKg)} kg</div>
            <div>Allergies: ${escapeHtml(patient.allergies)}</div>
            <div>Notes: ${escapeHtml(patient.notes || 'No notes')}</div>
          </div>
        </article>
      `
    )
    .join('');
}

function renderPrescriptionCards() {
  prescriptionList.innerHTML = state.prescriptions
    .map(
      (prescription) => `
        <article class="prescription-card">
          <h3>${escapeHtml(prescription.patientName)}</h3>
          <div class="patient-meta">
            <div>Medicine: ${escapeHtml(prescription.medicineName)}</div>
            <div>Dose: ${escapeHtml(formatDose(prescription.dose))}</div>
            <div>Frequency: ${escapeHtml(prescription.frequency)}</div>
            <div>Duration: ${escapeHtml(prescription.durationDays)} days</div>
            <div>Warnings: ${escapeHtml((prescription.warnings || []).join(', ') || 'None')}</div>
          </div>
        </article>
      `
    )
    .join('');
}

async function handleDoseCalculation(event) {
  event.preventDefault();

  const patientId = patientSelect.value;
  const medicineId = medicineSelect.value;

  if (!patientId || !medicineId) {
    doseResult.className = 'result-box warning';
    doseResult.textContent = 'Please select both a patient and a medicine.';
    return;
  }

  const response = await fetch('/api/calculate-dose', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patientId, medicineId })
  });

  const result = await response.json();

  if (!response.ok) {
    doseResult.className = 'result-box warning';
    doseResult.textContent = result.error || 'Unable to calculate dose.';
    return;
  }

  const warnings = result.warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join('');
  const statusClass = result.safe ? 'success' : 'warning';

  doseResult.className = `result-box ${statusClass}`;
  doseResult.innerHTML = `
    <strong>${escapeHtml(result.medicineName)}</strong><br />
    Patient: ${escapeHtml(state.patients.find((p) => Number(p.id) === Number(patientId)).name)}<br />
    Weight: ${escapeHtml(result.weightKg)} kg<br />
    Age: ${escapeHtml(result.age)} years<br />
    Suggested dose: ${escapeHtml(formatDose(result.recommendedDose))}<br />
    <ul>${warnings}</ul>
  `;
}

async function handlePatientSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  const response = await fetch('/api/patients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    alert('Unable to save patient');
    return;
  }

  form.reset();
  await loadData();
}

async function handlePrescriptionSubmit(event) {
  event.preventDefault();

  const payload = {
    patientId: prescriptionPatientSelect.value,
    medicineId: prescriptionMedicineSelect.value,
    frequency: document.getElementById('frequencyInput').value,
    durationDays: document.getElementById('durationInput').value
  };

  const response = await fetch('/api/prescriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    alert('Unable to save prescription');
    return;
  }

  await loadData();
  doseResult.className = 'result-box success';
  doseResult.textContent = 'Prescription saved successfully.';
}

document.getElementById('doseForm').addEventListener('submit', handleDoseCalculation);
document.getElementById('patientForm').addEventListener('submit', handlePatientSubmit);
document.getElementById('prescriptionForm').addEventListener('submit', handlePrescriptionSubmit);

loadData();
