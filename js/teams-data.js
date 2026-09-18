// Lex Liga 2026 – registered teams & entries
(function () {
  var futsalMen = [
    { name: "Predators FC", players: ["Khushwant Raj Khurkhuriya", "Sahil Dev", "Jagrata", "Srihas", "Arnav Yadav", "Naveen Pandey", "Praveen Rawat"] },
    { name: "OG's", players: ["Abhay", "Vikas", "Sourav", "Ajinkey", "Divyansh", "Bala", "Dr. Alaukik Srivastav (faculty)"] },
    { name: "Mr.Butterfly FC", players: ["Rudra Tak", "Yuvraj Sonker", "Kunnal Kumar", "Alok Kumar", "Om Mishra", "Saptak Das"] },
    { name: "Thassa United FC", players: ["Ayushhmaan Thakur", "Ayush Mishra", "Aditya Saini", "Dev Nandan", "Anshuman Singh", "Jatin Narula"] },
    { name: "Beer Pressure FC", players: ["Francis", "Sajora", "Adhitya", "Chirag", "Dhyeya Gohil", "Bhaumik", "Ranjit"] },
    { name: "One last Time!", players: ["Shree", "Varun", "Nayan", "Kawar", "Ritesh", "Nikesh", "Rishiraj"] },
    { name: "Hazel Aid Fc", players: ["Aadithyan M", "Siddharth Purohit", "Nakul Dev", "Surya", "Abhijeet", "Akshat Tripathi", "Ujjwal"] },
    { name: "Humble FC", players: ["Abhijeet", "Akshat", "Nakul", "Ujjwal", "Siddharth Purohit", "Aadithyan"] }
  ];
  var futsalWomen = ["Antara Joshi (Sem 1)", "Bhavika Tripathi (Sem 1)", "Avika Litoria (Sem 1)", "Astha (Sem 1)", "Mansi (Sem 3)", "Tuhinanshu (Sem 3)", "Subhashini (Sem 3)"];

  var bm = {
    "Men's Singles": ["Divyansh", "Rajesh Singh", "Aryaman Yadav", "Kunnal Kumar", "Harshit Agrawal", "Vaibhav Kumar", "Sahil Dev Hembram", "Khush Arora", "Yuvraj Sonker", "Vikas Sharma", "Bala Sriram B", "Nakul Dev Singh Rathore", "Naveen Prakash Pandey", "Yajur Rai Chhabra", "Ajinkya Jamane", "Rudra Tak", "Vaishnav Gupta", "Akshat Tripathi", "Shriansh Pachori", "Alok Kumar", "Abhas Singh", "Khushwant Raj Khurkhuriya", "Farinder Goyal"],
    "Men's Doubles": ["Divyansh & Khush Arora", "Kunnal Kumar & Rudra Tak", "Harshit Agrawal & Vaibhav Kumar", "Yuvraj Sonker & Nakul Dev Singh Rathore", "Yajur Rai Chhabra & Shriansh Pachori", "Abhijeet Raushan & Alok Kumar", "Vaishnav Gupta & Abhas Singh", "Aryaman Yadav & Om Mishra", "Vikas Sharma & Yash Raj Solanki", "Naveen Prakash Pandey & Praveen Rawat"],
    "Women's Singles": ["Kavyanshi", "Avishruti Singh", "Kavya Agrawal", "Jyoti Shukla", "Maitry"],
    "Women's Doubles": ["Bhavika Tripathi & Vaishnavi Kolkondi", "Priyanshi Srivastava & Maitry", "Astha Pandey & Sirali"],
    "Mixed Doubles": ["Divyansh & Jyoti Shukla", "Kunnal Kumar & Mansi Dadhich", "Vaibhav Kumar & Avishruti Singh", "Yuvraj Sonker & Antara Joshi", "Vaishnav Gupta & Pahal Sharma", "Khushwant Raj Khurkhuriya & Bhavika Tripathi", "Aryaman Yadav & Priyanshi Srivastava", "Yajur Rai Chhabra & Maitry Bhadani", "Shriansh Pachori & Kavyanshi", "Nakul Dev Singh Rathore & Subhashini", "Abhijeet Raushan & Tuhinanshu Chaudhary"]
  };

  function card(title, players) {
    return '<div class="team-card"><h3>' + title + '</h3><ul>' +
      players.map(function (p) { return '<li>' + p + '</li>'; }).join('') +
      '</ul></div>';
  }

  var menEl = document.getElementById('futsalMen');
  if (menEl) menEl.innerHTML = futsalMen.map(function (t) { return card(t.name, t.players); }).join('');

  var wEl = document.getElementById('futsalWomen');
  if (wEl) wEl.innerHTML = '<h3>Women\'s Team</h3><ul>' + futsalWomen.map(function (p) { return '<li>' + p + '</li>'; }).join('') + '</ul>';

  var bmEl = document.getElementById('bmEntries');
  if (bmEl) {
    bmEl.innerHTML = Object.keys(bm).map(function (cat) {
      return '<p class="cat-title">' + cat + '</p><div class="grid sm:grid-cols-2 gap-3">' +
        bm[cat].map(function (entry) {
          return '<div class="team-card"><h3 style="font-size:0.95rem">' + entry + '</h3></div>';
        }).join('') + '</div>';
    }).join('');
  }
})();
