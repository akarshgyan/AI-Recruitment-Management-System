const API_BASE = 'http://localhost:5000/';

let jobs = [];
let candidates = [];
let applications = [];
let interviews = [];



document.addEventListener('DOMContentLoaded', function () {

    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', dateOptions);

    showSection('dashboard');
});

function logout() {
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('onclick') === `showSection('${sectionId}')`) {
            link.classList.add('active');
        }
    });

    document.getElementById(sectionId).classList.add('active');

    switch (sectionId) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'jobs':
            loadJobs();
            break;
        case 'candidates':
            loadCandidates();
            break;
        case 'applications':
            loadApplications();
            break;
        case 'interviews':
            loadInterviews();
            break;
    }
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('show');

    if (modalId === 'addJobModal') {
        loadCompanyDropdown();
    } else if (modalId === 'addApplicationModal') {
        loadJobsDropdown();
        loadCandidatesDropdown();
    } else if (modalId === 'scheduleInterviewModal') {
        loadApplicationsDropdown();
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('show');
    }
}



async function loadDashboard() {
    try {
        await Promise.all([
            fetchJobs(),
            fetchCandidates(),
            fetchApplications(),
            fetchInterviews()
        ]);

        // Update Counters
        animateCounter('totalJobs', jobs.length);
        animateCounter('totalCandidates', candidates.length);
        animateCounter('totalApplications', applications.length);
        animateCounter('totalInterviews', interviews.length);

        loadRecentJobs();
        loadRecentApplications();
        renderChart();
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

function animateCounter(id, target) {
    let current = 0;
    const element = document.getElementById(id);
    const interval = setInterval(() => {
        if (current >= target) {
            clearInterval(interval);
            element.textContent = target;
        } else {
            current++;
            element.textContent = current;
        }
    }, 20);
}

function renderChart() {
    const ctx = document.getElementById('recruitmentChart').getContext('2d');


    const statusCounts = {
        'Applied': 0, 'Shortlisted': 0, 'Interview Scheduled': 0, 'Selected': 0, 'Rejected': 0
    };

    applications.forEach(app => {
        if (statusCounts[app.application_status] !== undefined) {
            statusCounts[app.application_status]++;
        }
    });

    if (window.myChart) {
        window.myChart.destroy();
    }

    window.myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(statusCounts),
            datasets: [{
                data: Object.values(statusCounts),
                backgroundColor: [
                    '#2563eb', // Applied - Royal Blue
                    '#7c3aed', // Shortlisted - Violet
                    '#d97706', // Interview - Amber
                    '#059669', // Selected - Emerald
                    '#dc2626'  // Rejected - Red
                ],
                borderWidth: 0
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



async function generateJD(event) {
    event.preventDefault();
    const title = document.getElementById('aiJobTitle').value;
    const company = document.getElementById('aiCompany').value;
    const resultDiv = document.getElementById('jdResult');

    resultDiv.style.display = 'block';
    resultDiv.innerHTML = '<p class="loading">Generating AI content...</p>';

    try {
        const response = await fetch(API_BASE + 'api_ai.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'generate_jd',
                title: title,
                company: company
            })
        });

        const data = await response.json();
        if (data.success) {
            resultDiv.textContent = data.result;
        } else {
            resultDiv.textContent = 'Error: ' + data.error;
        }
    } catch (error) {
        resultDiv.textContent = 'Error connecting to AI service.';
    }
}

async function generateQuestions(event) {
    event.preventDefault();
    const role = document.getElementById('aiQuestionRole').value;
    const resultDiv = document.getElementById('questionsResult');

    resultDiv.style.display = 'block';
    resultDiv.innerHTML = '<p class="loading">Generating questions...</p>';

    try {
        const response = await fetch(API_BASE + 'api_ai.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'generate_questions',
                job_title: role
            })
        });

        const data = await response.json();
        if (data.success) {
            const list = data.result.map(q => `<li>${q}</li>`).join('');
            resultDiv.innerHTML = `<ul>${list}</ul>`;
        } else {
            resultDiv.textContent = 'Error: ' + data.error;
        }
    } catch (error) {
        resultDiv.textContent = 'Error connecting to AI service.';
    }
}



async function fetchJobs() {
    const response = await fetch(API_BASE + 'api_jobs.php');
    jobs = await response.json();
    return jobs;
}

async function fetchCandidates() {
    const response = await fetch(API_BASE + 'api_candidates.php');
    candidates = await response.json();
    return candidates;
}

async function fetchApplications() {
    const response = await fetch(API_BASE + 'api_applications.php');
    applications = await response.json();
    return applications;
}

async function fetchInterviews() {
    const response = await fetch(API_BASE + 'api_interviews.php');
    interviews = await response.json();
    return interviews;
}



function loadRecentJobs() {
    const recentJobs = jobs.slice(0, 5);
    const html = `
        <table>
            <thead>
                <tr>
                    <th>Job Title</th>
                    <th>Company</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${recentJobs.map(job => `
                    <tr>
                        <td>${job.job_title}</td>
                        <td>${job.company_name}</td>
                        <td><span class="status-badge status-${job.job_status.toLowerCase()}">${job.job_status}</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    document.getElementById('recentJobs').innerHTML = html;
}

function loadRecentApplications() {
    const recentApps = applications.slice(0, 5);
    const html = `
        <table>
            <thead>
                <tr>
                    <th>Candidate</th>
                    <th>Job</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${recentApps.map(app => `
                    <tr>
                        <td>${app.first_name} ${app.last_name}</td>
                        <td>${app.job_title}</td>
                        <td><span class="status-badge status-${app.application_status.toLowerCase().replace(' ', '-')}">${app.application_status}</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    document.getElementById('recentApplications').innerHTML = html;
}

async function loadJobs() {
    await fetchJobs();
    displayJobs(jobs);
}

function displayJobs(jobsList) {
    if (jobsList.length === 0) {
        document.getElementById('jobsList').innerHTML = '<div class="empty-state"><p>No jobs found</p></div>';
        return;
    }
    const html = `
        <table>
            <thead>
                <tr>
                    <th>Job Title</th>
                    <th>Company</th>
                    <th>Location</th>
                    <th>Vacancies</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${jobsList.map(job => `
                    <tr>
                        <td><strong>${job.job_title}</strong></td>
                        <td>${job.company_name}</td>
                        <td>${job.location}</td>
                        <td>${job.vacancies}</td>
                        <td><span class="status-badge status-${job.job_status.toLowerCase()}">${job.job_status}</span></td>
                        <td><button class="btn btn-info" onclick="alert('View details clicked')">View</button></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    document.getElementById('jobsList').innerHTML = html;
}

function filterJobs() {
    const searchTerm = document.getElementById('jobSearch').value.toLowerCase();
    const statusFilter = document.getElementById('jobStatusFilter').value;
    const filtered = jobs.filter(job => {
        return (job.job_title.toLowerCase().includes(searchTerm) || job.company_name.toLowerCase().includes(searchTerm)) &&
            (!statusFilter || job.job_status === statusFilter);
    });
    displayJobs(filtered);
}

async function loadCandidates() {
    await fetchCandidates();
    displayCandidates(candidates);
}

function displayCandidates(list) {
    if (list.length === 0) {
        document.getElementById('candidatesList').innerHTML = '<div class="empty-state"><p>No candidates found</p></div>';
        return;
    }
    const html = `
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Experience</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${list.map(c => `
                    <tr>
                        <td>${c.first_name} ${c.last_name}</td>
                        <td>${c.email}</td>
                        <td>${c.total_experience} yrs</td>
                        <td><button class="btn btn-info" onclick="alert('View candidate clicked')">View</button></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    document.getElementById('candidatesList').innerHTML = html;
}

async function loadApplications() {
    await fetchApplications();
    displayApplications(applications);
}

function displayApplications(list) {
    if (list.length === 0) {
        document.getElementById('applicationsList').innerHTML = '<div class="empty-state"><p>No applications found</p></div>';
        return;
    }
    const html = `
        <table>
            <thead>
                <tr>
                    <th>Candidate</th>
                    <th>Job</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${list.map(app => `
                    <tr>
                        <td>${app.first_name} ${app.last_name}</td>
                        <td>${app.job_title}</td>
                        <td><span class="status-badge status-${app.application_status.toLowerCase().replace(' ', '-')}">${app.application_status}</span></td>
                        <td><button class="btn btn-success" onclick="updateApplicationStatus(${app.application_id})">Update</button></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    document.getElementById('applicationsList').innerHTML = html;
}

async function loadInterviews() {
    await fetchInterviews();
    displayInterviews(interviews);
}

function displayInterviews(list) {
    if (list.length === 0) {
        document.getElementById('interviewsList').innerHTML = '<div class="empty-state"><p>No interviews found</p></div>';
        return;
    }
    const html = `
        <table>
            <thead>
                <tr>
                    <th>Candidate</th>
                    <th>Job</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${list.map(i => `
                    <tr>
                        <td>${i.first_name} ${i.last_name}</td>
                        <td>${i.job_title}</td>
                        <td>${i.interview_date} ${i.interview_time}</td>
                        <td><span class="status-badge status-${i.interview_status.toLowerCase()}">${i.interview_status}</span></td>
                        <td>${i.interview_status === 'Scheduled' ? `<button class="btn btn-success" onclick="updateInterviewResult(${i.interview_id})">Result</button>` : ''}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    document.getElementById('interviewsList').innerHTML = html;
}



async function addJob(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    data.recruiter_id = 1;
    await postData('api_jobs.php', data, 'Job added!', 'addJobModal', 'jobs');
}

async function addCandidate(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    await postData('api_candidates.php', data, 'Candidate registered!', 'addCandidateModal', 'candidates');
}

async function addApplication(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    await postData('api_applications.php', data, 'Application submitted!', 'addApplicationModal', 'applications');
}

async function scheduleInterview(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    await postData('api_interviews.php', data, 'Interview scheduled!', 'scheduleInterviewModal', 'interviews');
}

async function postData(endpoint, data, successMsg, modalId, sectionId) {
    try {
        const response = await fetch(API_BASE + endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (result.success) {
            closeModal(modalId);
            document.querySelector('#' + modalId + ' form').reset();
            showSection(sectionId);
            alert(successMsg);
        } else {
            alert('Error: ' + result.message);
        }
    } catch (e) { console.error(e); }
}

async function updateApplicationStatus(id) {
    const newStatus = prompt('Status: Shortlisted, Interview Scheduled, Selected, Rejected');
    if (newStatus) {
        await fetch(API_BASE + 'api_applications.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ application_id: id, application_status: newStatus })
        });
        loadApplications();
    }
}

async function updateInterviewResult(id) {
    const result = prompt('Result: Pass, Fail, On-Hold');
    if (result) {
        await fetch(API_BASE + 'api_interviews.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ interview_id: id, result: result, interview_status: 'Completed' })
        });
        loadInterviews();
    }
}



async function loadCompanyDropdown() {
    const res = await fetch(API_BASE + 'api_companies.php');
    const companies = await res.json();
    populateSelect('#addJobForm select[name="company_id"]', companies, 'company_id', 'company_name');
}

async function loadJobsDropdown() {
    const jobs = await fetchJobs();
    populateSelect('#addApplicationForm select[name="job_id"]', jobs, 'job_id', 'job_title');
}

async function loadCandidatesDropdown() {
    const candidates = await fetchCandidates();
    populateSelect('#addApplicationForm select[name="candidate_id"]', candidates, 'candidate_id', 'first_name', 'last_name');
}

async function loadApplicationsDropdown() {
    const apps = await fetchApplications();
    populateSelect('#scheduleInterviewForm select[name="application_id"]', apps, 'application_id', 'job_title', 'first_name');
}

function populateSelect(selector, items, valueKey, textKey1, textKey2 = '') {
    const select = document.querySelector(selector);
    let html = '<option value="">Select</option>';
    items.forEach(item => {
        const text = item[textKey1] + (textKey2 ? ' ' + item[textKey2] : '');
        html += `<option value="${item[valueKey]}">${text}</option>`;
    });
    select.innerHTML = html;
}
