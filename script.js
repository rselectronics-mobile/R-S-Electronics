import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

/*
  PRODUCTION SETUP:
  1) Create Firebase project.
  2) Enable Authentication > Email/Password.
  3) Create Firestore Database.
  4) Replace the placeholder firebaseConfig below with your Firebase web config.
  5) Publish firestore.rules from the Firestore Rules tab.
  6) Deploy this folder to GitHub Pages/Netlify/Vercel.
*/
const firebaseConfig={
  apiKey:"YOUR_FIREBASE_API_KEY",
  authDomain:"YOUR_PROJECT.firebaseapp.com",
  projectId:"YOUR_PROJECT_ID",
  storageBucket:"YOUR_PROJECT.firebasestorage.app",
  messagingSenderId:"YOUR_SENDER_ID",
  appId:"YOUR_APP_ID"
};
const configured=!firebaseConfig.apiKey.startsWith("YOUR_");

// ===== DOM ELEMENTS (FIX #1 — required because type="module" does not expose HTML ids as globals) =====
const loader=document.getElementById('loader');
const progress=document.getElementById('progress');
const nav=document.getElementById('nav');
const menuBtn=document.getElementById('menuBtn');
const connectionStatus=document.getElementById('connectionStatus');
const productSearch=document.getElementById('productSearch');
const productGrid=document.getElementById('productGrid');
const productBrand=document.getElementById('productBrand');
const priceFilter=document.getElementById('priceFilter');
const clearFilters=document.getElementById('clearFilters');
const offerGrid=document.getElementById('offerGrid');
const brandGrid=document.getElementById('brandGrid');
const brandSearch=document.getElementById('brandSearch');
const booking=document.getElementById('booking');
const price=document.getElementById('price');
const down=document.getElementById('down');
const rate=document.getElementById('rate');
const months=document.getElementById('months');
const emi=document.getElementById('emi');
const exchange=document.getElementById('exchange');
const oldPrice=document.getElementById('oldPrice');
const exchangeResult=document.getElementById('exchangeResult');
const bookingForm=document.getElementById('bookingForm');
const custName=document.getElementById('custName');
const custPhone=document.getElementById('custPhone');
const custBrand=document.getElementById('custBrand');
const custModel=document.getElementById('custModel');
const custBudget=document.getElementById('custBudget');
const custReq=document.getElementById('custReq');
const custMsg=document.getElementById('custMsg');
const whatsappBtn=document.getElementById('whatsappBtn');
const formStatus=document.getElementById('formStatus');
const loginPanel=document.getElementById('loginPanel');
const consolePanel=document.getElementById('consolePanel');
const adminEmail=document.getElementById('adminEmail');
const adminPassword=document.getElementById('adminPassword');
const adminStatus=document.getElementById('adminStatus');
const loginBtn=document.getElementById('loginBtn');
const signupBtn=document.getElementById('signupBtn');
const logoutBtn=document.getElementById('logoutBtn');
const seedBtn=document.getElementById('seedBtn');
const addStock=document.getElementById('addStock');
const stockList=document.getElementById('stockList');
const invModel=document.getElementById('invModel');
const invBrand=document.getElementById('invBrand');
const invPrice=document.getElementById('invPrice');
const invStock=document.getElementById('invStock');
const invMeta=document.getElementById('invMeta');
const offerTitle=document.getElementById('offerTitle');
const offerText=document.getElementById('offerText');
const offerTone=document.getElementById('offerTone');
const addOffer=document.getElementById('addOffer');
const offerList=document.getElementById('offerList');
const enquiryList=document.getElementById('enquiryList');
const exportEnquiries=document.getElementById('exportEnquiries');
const dashProducts=document.getElementById('dashProducts');
const dashStock=document.getElementById('dashStock');
const dashEnquiries=document.getElementById('dashEnquiries');
const dashOffers=document.getElementById('dashOffers');

const brands=["Xiaomi","Redmi","POCO","Apple","Samsung","Vivo","OPPO","Realme","OnePlus","Motorola","iQOO","Nothing","Google Pixel","Nokia","Lava","Infinix","Tecno","Honor","ASUS","Sony","Huawei","Lenovo","ZTE","Meizu","HTC","TCL","Itel","Alcatel","Coolpad","Micromax","BLU","Fairphone","Oukitel","Ulefone","Blackview","Doogee","Sharp","Philips","Microsoft"];
const demoProducts=[
["Xiaomi","Redmi Note Series",15000,10,"Performance + value"],["Xiaomi","Xiaomi Number Series",28000,5,"Premium all-rounder"],["POCO","POCO X Series",22000,8,"Performance focused"],["Samsung","Galaxy A Series",25000,7,"Balanced everyday phone"],["Samsung","Galaxy S Series",65000,3,"Premium flagship"],["Apple","iPhone Series",55000,4,"Premium ecosystem"],["Vivo","V Series",30000,6,"Camera focused"],["OPPO","Reno Series",30000,5,"Design + camera"],["Realme","Number Series",25000,7,"Fast charging + value"],["OnePlus","Nord Series",30000,5,"Smooth performance"],["Motorola","Edge Series",35000,4,"Clean Android"],["iQOO","Neo Series",30000,5,"Gaming performance"]];
const demoOffers=[["XIAOMI SMART PICKS","Latest generation • Great value • Retail & wholesale","orange"],["EMI + EXCHANGE","Bring your requirement and let our team guide you.","blue"],["WHOLESALE ORDERS","Bulk enquiries for retailers and businesses.","purple"]];

let app,auth,db,currentUser=null,products=[],offers=[];
if(configured){app=initializeApp(firebaseConfig);auth=getAuth(app);db=getFirestore(app)}
else{
  connectionStatus.textContent="Demo mode: add Firebase config in script.js to enable cloud database/login.";
}

brands.forEach(b=>{let d=document.createElement("div");d.textContent=b;d.onclick=()=>{custBrand.value=b;booking.scrollIntoView({behavior:"smooth"})};brandGrid.appendChild(d);[custBrand,productBrand].forEach(s=>{let o=document.createElement("option");o.value=b;o.textContent=b;s.appendChild(o)})});
brandSearch.oninput=e=>{let q=e.target.value.toLowerCase();[...brandGrid.children].forEach(x=>x.style.display=x.textContent.toLowerCase().includes(q)?"":"none")};

function localProducts(){return JSON.parse(localStorage.getItem("rs_v5_products")||"null")||demoProducts}
function localOffers(){return JSON.parse(localStorage.getItem("rs_v5_offers")||"null")||demoOffers}
async function loadProducts(){if(!configured){products=localProducts();return renderProducts()}const s=await getDocs(collection(db,"products"));products=s.docs.map(x=>({id:x.id,...x.data()}));renderProducts()}
async function loadOffers(){if(!configured){offers=localOffers();return renderOffers()}const s=await getDocs(collection(db,"offers"));offers=s.docs.map(x=>({id:x.id,...x.data()}));renderOffers()}
function renderProducts(){let q=productSearch.value.toLowerCase(),b=productBrand.value,cap=+priceFilter.value||Infinity;productGrid.innerHTML="";products.filter(p=>(!q||(p.brand+" "+p.model).toLowerCase().includes(q))&&(!b||p.brand===b)&&+p.price<=cap).forEach(p=>{let d=document.createElement("article");d.className="product-card";d.innerHTML=`<div class="product-visual">${p.img?`<img src="${p.img}" alt="${p.model}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><b style="display:none">${p.brand}</b>`:`<b>${p.brand}</b>`}</div><small>${p.brand}</small><h3>${p.model}</h3><div class="product-meta">${p.meta||"Mobile phone"} · Stock ${p.stock??0}</div><div class="product-bottom"><span class="product-price">₹${(+p.price).toLocaleString("en-IN")}*</span><button>Enquire</button></div>`;d.querySelector("button").onclick=()=>{custBrand.value=p.brand;custModel.value=p.model;custBudget.value=p.price;booking.scrollIntoView({behavior:"smooth"})};productGrid.appendChild(d)})}
function renderOffers(){offerGrid.innerHTML=offers.map(o=>`<article class="offer ${o.tone||"orange"}"><small>${o.title}</small><h3>${o.title}</h3><p>${o.text}</p><a href="#booking">Enquire →</a></article>`).join("")}
["productSearch","productBrand","priceFilter"].forEach(id=>document.getElementById(id).addEventListener("input",renderProducts));clearFilters.onclick=()=>{productSearch.value=productBrand.value=priceFilter.value="";renderProducts()};

function calcEMI(){let p=Math.max(0,+price.value-(+down.value||0)),r=(+rate.value||0)/1200,n=Math.max(1,+months.value||1),e=r?p*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1):p/n;emi.textContent="₹"+Math.round(e).toLocaleString("en-IN")}["price","down","rate","months"].forEach(id=>document.getElementById(id).addEventListener("input",calcEMI));calcEMI();
function calcExchange(){let v=Math.max(0,+oldPrice.value||0),m={excellent:[.70,.85],good:[.60,.75],fair:[.45,.65]}[exchange.value];exchangeResult.textContent="₹"+Math.round(v*m[0]).toLocaleString("en-IN")+" – ₹"+Math.round(v*m[1]).toLocaleString("en-IN")}["oldPrice","exchange"].forEach(id=>document.getElementById(id).addEventListener("input",calcExchange));exchange.addEventListener("change",calcExchange);calcExchange();

function getData(){return{name:custName.value.trim(),phone:custPhone.value.trim(),brand:custBrand.value,model:custModel.value.trim(),req:custReq.value,budget:custBudget.value,msg:custMsg.value.trim()}}
function message(d){return `Hello R.S. Electronics,\n\nNew mobile enquiry:\nName: ${d.name}\nPhone: ${d.phone}\nBrand: ${d.brand}\nModel: ${d.model}\nRequirement: ${d.req}\nBudget: ${d.budget||"Not specified"}\nMessage: ${d.msg||"—"}\n\nOwner: Vinay Maurya\nAddress: Roadways Bus Adda ke Pass, Lakhimpur Kheri`}
async function submitEnquiry(d){if(configured)await addDoc(collection(db,"enquiries"),{...d,createdAt:serverTimestamp()});else{let a=JSON.parse(localStorage.getItem("rs_v5_enquiries")||"[]");a.unshift({...d,time:new Date().toISOString()});localStorage.setItem("rs_v5_enquiries",JSON.stringify(a))}}
bookingForm.onsubmit=async e=>{e.preventDefault();let d=getData();if(!/^[6-9]\d{9}$/.test(d.phone)){formStatus.textContent="Please enter a valid 10-digit Indian mobile number.";return}try{await submitEnquiry(d);formStatus.textContent="Enquiry saved. Opening your email app…";location.href=`mailto:ravikashyap5125r@gmail.com?subject=${encodeURIComponent("R.S. Electronics — New Mobile Enquiry")}&body=${encodeURIComponent(message(d))}`}catch(err){formStatus.textContent="Could not save online. Please use WhatsApp or call."}};
whatsappBtn.onclick=e=>{let d=getData();if(!d.name||!d.phone||!d.brand||!d.model){e.preventDefault();formStatus.textContent="Please fill Name, Phone, Brand and Model first.";return}e.currentTarget.href="https://wa.me/918858616632?text="+encodeURIComponent(message(d))};

function renderStockAdmin(){let data=products;stockList.innerHTML=data.length?data.map(p=>`<div class="stock-row"><b>${p.model}</b><span>${p.brand}</span><span>₹${(+p.price).toLocaleString("en-IN")}</span><span>${p.stock??0}</span><span>${p.meta||""}</span><button data-id="${p.id||""}" data-model="${p.model}">Delete</button></div>`).join(""):"<div class='muted'>No products.</div>";stockList.querySelectorAll("button").forEach(b=>b.onclick=async()=>{if(configured&&b.dataset.id)await deleteDoc(doc(db,"products",b.dataset.id));else{products=products.filter(x=>x.model!==b.dataset.model);localStorage.setItem("rs_v5_products",JSON.stringify(products))}await loadProducts();renderStockAdmin();await refreshDashboard()})}
addStock.onclick=async()=>{if(!invModel.value||!invBrand.value||!invPrice.value)return;let p={brand:invBrand.value,model:invModel.value,price:+invPrice.value,stock:+invStock.value||0,meta:invMeta.value||"New stock"};if(configured){await addDoc(collection(db,"products"),p)}else{products.push(p);localStorage.setItem("rs_v5_products",JSON.stringify(products))}invModel.value=invBrand.value=invPrice.value=invStock.value=invMeta.value="";await loadProducts();renderStockAdmin();await refreshDashboard()};

async function renderEnquiries(){let a=[];if(configured){let s=await getDocs(collection(db,"enquiries"));a=s.docs.map(x=>({id:x.id,...x.data()}))}else a=JSON.parse(localStorage.getItem("rs_v5_enquiries")||"[]");enquiryList.innerHTML=a.length?a.map(x=>`<div class="enquiry-card"><small>${x.name||""} · ${x.phone||""}</small><b>${x.brand||""} — ${x.model||""}</b><br>${x.req||""} · Budget ${x.budget||"—"}<br><span class="muted">${x.msg||""}</span></div>`).join(""):"<div class='muted'>No enquiries yet.</div>"}
async function renderOfferAdmin(){offerList.innerHTML=offers.map(o=>`<div class="stock-row offer-admin"><div><b>${o.title}</b><br><span>${o.text}</span></div><span>${o.tone}</span><button data-id="${o.id||""}" data-title="${o.title}">Delete</button></div>`).join("");offerList.querySelectorAll("button").forEach(b=>b.onclick=async()=>{if(configured&&b.dataset.id)await deleteDoc(doc(db,"offers",b.dataset.id));else{offers=offers.filter(x=>x.title!==b.dataset.title);localStorage.setItem("rs_v5_offers",JSON.stringify(offers))}await loadOffers();renderOfferAdmin();await refreshDashboard()})}
addOffer.onclick=async()=>{if(!offerTitle.value)return;let o={title:offerTitle.value,text:offerText.value||"Ask in store for details.",tone:offerTone.value};if(configured)await addDoc(collection(db,"offers"),o);else{offers.push(o);localStorage.setItem("rs_v5_offers",JSON.stringify(offers))}offerTitle.value=offerText.value="";await loadOffers();renderOfferAdmin();await refreshDashboard()};

// FIX #2 — Export CSV handler was completely missing in V5. Added here.
exportEnquiries.onclick=async()=>{
  let rows=[['Name','Phone','Brand','Model','Requirement','Budget','Message','Time']];
  let enqs=[];
  if(configured){const s=await getDocs(collection(db,'enquiries'));enqs=s.docs.map(x=>x.data())}
  else enqs=JSON.parse(localStorage.getItem('rs_v5_enquiries')||'[]');
  enqs.forEach(x=>rows.push([x.name,x.phone,x.brand,x.model,x.req,x.budget,x.msg,x.createdAt?.seconds||x.time||'']));
  const csv=rows.map(r=>r.map(v=>`"${String(v||'').replace(/"/g,'""')}"`).join(',')).join('\n');
  const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
  a.download='rs-electronics-enquiries.csv';a.click();
};

// FIX #3 — refreshDashboard() now also loads the real enquiries count (was hard-coded/missing before).
async function refreshDashboard(){
  dashProducts.textContent=products.length;
  dashStock.textContent=products.reduce((s,x)=>s+(+x.stock||0),0);
  dashOffers.textContent=offers.length;
  if(configured){const s=await getDocs(collection(db,'enquiries'));dashEnquiries.textContent=s.size}
  else{const e=JSON.parse(localStorage.getItem('rs_v5_enquiries')||'[]');dashEnquiries.textContent=e.length}
}

function setAdminState(user){currentUser=user;loginPanel.classList.toggle("hidden",!!user);consolePanel.classList.toggle("hidden",!user);adminStatus.textContent=user?`Logged in: ${user.email}`:"Login required for store management."}
loginBtn.onclick=async()=>{if(!configured){adminStatus.textContent="Demo mode: configure Firebase to enable secure login.";return}try{await signInWithEmailAndPassword(auth,adminEmail.value,adminPassword.value)}catch(e){adminStatus.textContent="Login failed. Check email/password and Firebase Authentication."}}
signupBtn.onclick=async()=>{if(!configured){adminStatus.textContent="Configure Firebase first.";return}try{await createUserWithEmailAndPassword(auth,adminEmail.value,adminPassword.value);adminStatus.textContent="Account created and logged in."}catch(e){adminStatus.textContent="Could not create account. Enable Email/Password in Firebase."}}
logoutBtn.onclick=()=>configured&&signOut(auth);
if(configured)onAuthStateChanged(auth,async user=>{setAdminState(user);if(user){await loadProducts();await loadOffers();renderStockAdmin();await renderEnquiries();await renderOfferAdmin();await refreshDashboard()}});
else setAdminState(null);

document.querySelectorAll(".admin-tabs button").forEach(b=>b.onclick=async()=>{document.querySelectorAll(".admin-tabs button").forEach(x=>x.classList.remove("active"));b.classList.add("active");document.querySelectorAll(".admin-panel").forEach(x=>x.classList.add("hidden"));document.getElementById(b.dataset.tab).classList.remove("hidden");if(b.dataset.tab==="enquiries")await renderEnquiries();if(b.dataset.tab==="dashboard")await refreshDashboard()});
seedBtn.onclick=async()=>{for(const p of demoProducts){if(configured)await addDoc(collection(db,"products"),{brand:p[0],model:p[1],price:p[2],stock:p[3],meta:p[4]});else products.push({brand:p[0],model:p[1],price:p[2],stock:p[3],meta:p[4]})}if(!configured)localStorage.setItem("rs_v5_products",JSON.stringify(products));await loadProducts();renderStockAdmin();await refreshDashboard()};

async function init(){await loadProducts();await loadOffers();connectionStatus.textContent=configured?"Connected to store backend.":"Demo mode active — configure Firebase for cloud sync.";if(currentUser){renderStockAdmin();await renderEnquiries();await renderOfferAdmin();await refreshDashboard()}}
init();

addEventListener("scroll",()=>{let h=document.documentElement.scrollHeight-innerHeight;progress.style.width=(scrollY/h*100)+"%"});
menuBtn.onclick=()=>{nav.style.display=nav.style.display==="flex"?"none":"flex"};
const observer=new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&e.target.classList.add("show")),{threshold:.1});document.querySelectorAll(".reveal").forEach(x=>observer.observe(x));
addEventListener("load",()=>setTimeout(()=>loader.remove(),900));
