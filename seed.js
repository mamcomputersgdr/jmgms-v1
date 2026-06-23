/* ══════════════════════════════════════════
   JMGMS — Seed / Demo Data
══════════════════════════════════════════ */

function seedData() {
  const db = DB.get();
  if (db.families.length > 0) return; // already seeded

  db.families = [
    { id:'JM0001', name:'Mohammed Abdul Kareem', mobile:'9876543210', mobile2:'', address:'House #12, Near Masjid, Gandhari', members:5, status:'approved', doc:'Aadhaar Card', regDate:'2024-01-15', notes:'', password:'family123' },
    { id:'JM0002', name:'Ibrahim Hussain',        mobile:'9988776655', mobile2:'9988776600', address:'Old Colony, Gandhari', members:4, status:'approved', doc:'Ration Card', regDate:'2024-02-10', notes:'', password:'family123' },
    { id:'JM0003', name:'Abdul Rahman Shaikh',    mobile:'9123456789', mobile2:'', address:'Main Road, Gandhari', members:6, status:'approved', doc:'Voter ID', regDate:'2024-03-05', notes:'', password:'family123' },
    { id:'JM0004', name:'Farooq Ahmed',           mobile:'9234567890', mobile2:'', address:'Bus Stand Area, Gandhari', members:3, status:'approved', doc:'Aadhaar Card', regDate:'2024-03-20', notes:'', password:'family123' },
    { id:'JM0005', name:'Yusuf Mirza',            mobile:'9345678901', mobile2:'', address:'East Side, Gandhari', members:7, status:'approved', doc:'Ration Card', regDate:'2024-04-12', notes:'', password:'family123' },
    { id:'JM0006', name:'Saleem Baig',            mobile:'9456789012', mobile2:'', address:'West Lane, Gandhari', members:4, status:'approved', doc:'Voter ID', regDate:'2024-05-01', notes:'', password:'family123' },
    { id:'JM0007', name:'Iqbal Shaikh',           mobile:'9567890123', mobile2:'', address:'North Colony, Gandhari', members:5, status:'approved', doc:'Aadhaar Card', regDate:'2024-06-10', notes:'', password:'family123' },
    { id:'JM0008', name:'Rasheed Khan',           mobile:'9678901234', mobile2:'', address:'Market Road, Gandhari', members:3, status:'approved', doc:'Ration Card', regDate:'2024-07-20', notes:'', password:'family123' },
  ];
  db.counters.family = 8;

  db.payments = [
    { id:'MC-2025-0001', familyId:'JM0001', familyName:'Mohammed Abdul Kareem', category:'Monthly Chanda', month:'January',  amount:200, date:'2025-01-05', mode:'Cash',         notes:'', type:'monthly' },
    { id:'MC-2025-0002', familyId:'JM0002', familyName:'Ibrahim Hussain',        category:'Monthly Chanda', month:'January',  amount:200, date:'2025-01-07', mode:'Cash',         notes:'', type:'monthly' },
    { id:'MC-2025-0003', familyId:'JM0003', familyName:'Abdul Rahman Shaikh',    category:'Monthly Chanda', month:'January',  amount:200, date:'2025-01-10', mode:'UPI',          notes:'', type:'monthly' },
    { id:'MC-2025-0004', familyId:'JM0004', familyName:'Farooq Ahmed',           category:'Monthly Chanda', month:'January',  amount:200, date:'2025-01-12', mode:'Cash',         notes:'', type:'monthly' },
    { id:'CF-2025-0001', familyId:'JM0001', familyName:'Mohammed Abdul Kareem', category:'Construction Fund', month:'',       amount:5000, date:'2025-02-01', mode:'Cash',        notes:'MashAllah! Generous donation', type:'special' },
    { id:'MC-2025-0005', familyId:'JM0001', familyName:'Mohammed Abdul Kareem', category:'Monthly Chanda', month:'February', amount:200, date:'2025-02-03', mode:'Cash',         notes:'', type:'monthly' },
    { id:'MC-2025-0006', familyId:'JM0002', familyName:'Ibrahim Hussain',        category:'Monthly Chanda', month:'February', amount:200, date:'2025-02-06', mode:'Cash',         notes:'', type:'monthly' },
    { id:'SC-2025-0001', familyId:'JM0004', familyName:'Farooq Ahmed',           category:'Ramzan Fund',    month:'',        amount:1000, date:'2025-03-01', mode:'Cash',         notes:'Ramzan Mubarak', type:'special' },
    { id:'MC-2025-0007', familyId:'JM0005', familyName:'Yusuf Mirza',            category:'Monthly Chanda', month:'March',   amount:200, date:'2025-03-05', mode:'UPI',          notes:'', type:'monthly' },
    { id:'CF-2025-0002', familyId:'JM0005', familyName:'Yusuf Mirza',            category:'Construction Fund', month:'',     amount:10000, date:'2025-04-10', mode:'Bank Transfer', notes:'For new hall construction', type:'special' },
    { id:'MC-2025-0008', familyId:'JM0006', familyName:'Saleem Baig',            category:'Monthly Chanda', month:'April',   amount:200, date:'2025-04-03', mode:'Cash',         notes:'', type:'monthly' },
    { id:'DN-2025-0001', familyId:'JM0003', familyName:'Abdul Rahman Shaikh',    category:'General Donation', month:'',      amount:500, date:'2025-04-20', mode:'Cash',         notes:'General khairaat', type:'special' },
    { id:'MC-2026-0001', familyId:'JM0001', familyName:'Mohammed Abdul Kareem', category:'Monthly Chanda', month:'January',  amount:200, date:'2026-01-05', mode:'Cash',         notes:'', type:'monthly' },
    { id:'MC-2026-0002', familyId:'JM0002', familyName:'Ibrahim Hussain',        category:'Monthly Chanda', month:'January',  amount:200, date:'2026-01-06', mode:'Cash',         notes:'', type:'monthly' },
    { id:'MC-2026-0003', familyId:'JM0003', familyName:'Abdul Rahman Shaikh',    category:'Monthly Chanda', month:'February', amount:200, date:'2026-02-04', mode:'UPI',          notes:'', type:'monthly' },
    { id:'MC-2026-0004', familyId:'JM0004', familyName:'Farooq Ahmed',           category:'Monthly Chanda', month:'February', amount:200, date:'2026-02-07', mode:'Cash',         notes:'', type:'monthly' },
    { id:'MC-2026-0005', familyId:'JM0001', familyName:'Mohammed Abdul Kareem', category:'Monthly Chanda', month:'March',    amount:200, date:'2026-03-03', mode:'Cash',         notes:'', type:'monthly' },
    { id:'MC-2026-0006', familyId:'JM0005', familyName:'Yusuf Mirza',            category:'Monthly Chanda', month:'April',   amount:200, date:'2026-04-05', mode:'UPI',          notes:'', type:'monthly' },
    { id:'MC-2026-0007', familyId:'JM0006', familyName:'Saleem Baig',            category:'Monthly Chanda', month:'May',     amount:200, date:'2026-05-02', mode:'Cash',         notes:'', type:'monthly' },
    { id:'MC-2026-0008', familyId:'JM0007', familyName:'Iqbal Shaikh',           category:'Monthly Chanda', month:'May',     amount:200, date:'2026-05-10', mode:'Cash',         notes:'', type:'monthly' },
    { id:'CF-2026-0001', familyId:'JM0001', familyName:'Mohammed Abdul Kareem', category:'Construction Fund', month:'',      amount:2000, date:'2026-05-15', mode:'Cash',        notes:'', type:'special' },
    { id:'MC-2026-0009', familyId:'JM0001', familyName:'Mohammed Abdul Kareem', category:'Monthly Chanda', month:'June',    amount:200, date:'2026-06-02', mode:'Cash',         notes:'', type:'monthly' },
    { id:'MC-2026-0010', familyId:'JM0002', familyName:'Ibrahim Hussain',        category:'Monthly Chanda', month:'June',    amount:200, date:'2026-06-04', mode:'Cash',         notes:'', type:'monthly' },
  ];
  db.counters.mc = 10; db.counters.cf = 3; db.counters.sc = 1; db.counters.dn = 1;

  db.expenses = [
    { id:'EXP-2026-0001', category:'Electricity',    desc:'January electricity bill',        amount:850,  date:'2026-01-15', mode:'Cash' },
    { id:'EXP-2026-0002', category:'Imam Salary',    desc:'Imam Sahab salary — January',     amount:8000, date:'2026-01-31', mode:'Cash' },
    { id:'EXP-2026-0003', category:'Muazzin Salary', desc:'Muazzin salary — January',        amount:3000, date:'2026-01-31', mode:'Cash' },
    { id:'EXP-2026-0004', category:'Electricity',    desc:'February electricity bill',       amount:920,  date:'2026-02-15', mode:'Cash' },
    { id:'EXP-2026-0005', category:'Maintenance',    desc:'Wudu area repair & tiles',        amount:2500, date:'2026-02-20', mode:'Cash' },
    { id:'EXP-2026-0006', category:'Imam Salary',    desc:'Imam Sahab salary — February',    amount:8000, date:'2026-02-28', mode:'Cash' },
    { id:'EXP-2026-0007', category:'Muazzin Salary', desc:'Muazzin salary — February',       amount:3000, date:'2026-02-28', mode:'Cash' },
    { id:'EXP-2026-0008', category:'Water',          desc:'Water tank refill — March',       amount:300,  date:'2026-03-10', mode:'Cash' },
    { id:'EXP-2026-0009', category:'Imam Salary',    desc:'Imam Sahab salary — March',       amount:8000, date:'2026-03-31', mode:'Cash' },
    { id:'EXP-2026-0010', category:'Electricity',    desc:'April electricity bill',          amount:870,  date:'2026-04-15', mode:'Cash' },
    { id:'EXP-2026-0011', category:'Cleaner Salary', desc:'Cleaner salary — April',          amount:2000, date:'2026-04-30', mode:'Cash' },
    { id:'EXP-2026-0012', category:'Internet',       desc:'Internet bill — May',             amount:699,  date:'2026-05-10', mode:'UPI'  },
    { id:'EXP-2026-0013', category:'Imam Salary',    desc:'Imam Sahab salary — May',         amount:8000, date:'2026-05-31', mode:'Cash' },
    { id:'EXP-2026-0014', category:'Stationery',     desc:'Receipt books & stationery',      amount:450,  date:'2026-06-01', mode:'Cash' },
  ];
  db.counters.exp = 14;

  db.funds = [
    { id:'fund-1', name:'Construction Fund',   desc:'Masjid expansion & new hall construction', target:500000, collected:17000, spent:0 },
    { id:'fund-2', name:'Water Tank Fund',      desc:'New overhead water tank installation',      target:80000,  collected:0,     spent:0 },
    { id:'fund-3', name:'Ramzan Fund',          desc:'Iftar arrangements & Ramzan activities',    target:50000,  collected:1000,  spent:0 },
    { id:'fund-4', name:'CCTV Fund',            desc:'CCTV surveillance system for masjid',       target:30000,  collected:0,     spent:0 },
    { id:'fund-5', name:'Madrasa Fund',         desc:'Children Islamic education programme',      target:100000, collected:0,     spent:0 },
  ];

  db.announcements = [
    { id:'ann-1', type:'general', title:"Jumu'ah Timing — Summer Schedule", body:"Jumu'ah (Friday Prayer) will be held at 1:15 PM during summer months. Khutbah begins at 1:00 PM. Please arrive early to find a place and listen to the khutbah from the beginning.", date:'2026-06-15' },
    { id:'ann-2', type:'meeting', title:'Monthly Committee Meeting — Sunday 22nd June', body:'Monthly Masjid Committee meeting will be held after Asr prayer on Sunday, 22nd June 2026 in the main hall. All committee members are requested to attend. Agenda: Construction fund review, accounts for May, new family approvals.', date:'2026-06-18' },
    { id:'ann-3', type:'urgent', title:'Construction Fund — Appeal for Donations', body:'Alhamdulillah, the masjid expansion project has been approved. We are collecting funds for the new prayer hall. Target: ₹5,00,000. Collected so far: ₹17,000. Please contribute generously. Contact Treasurer for details. May Allah accept your sadaqah.', date:'2026-06-20' },
    { id:'ann-4', type:'general', title:'Monthly Chanda Collection — June 2026', body:'Families are requested to pay their monthly chanda (₹200) at the earliest. The Treasurer is available at the masjid after Maghrib prayers on weekdays. You can also pay via UPI.', date:'2026-06-21' },
  ];

  db.pending = [
    { name:'Khalid Ansari',  mobile:'9700123456', address:'South Lane, Gandhari', members:4, doc:'Aadhaar Card', password:'family123', submitted:'2026-06-19', notes:'' },
    { name:'Saeed Khan',     mobile:'9812345678', address:'West Colony, Gandhari', members:3, doc:'Ration Card',  password:'family123', submitted:'2026-06-21', notes:'' },
  ];

  DB.save();
  console.log('✅ JMGMS seed data loaded');
}
