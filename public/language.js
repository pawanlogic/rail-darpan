(() => {
  "use strict";

  const STORAGE_KEY = "rail-darpan-language";
  const HI = {
    "Your Ultimate Indian Railways Companion": "भारतीय रेलवे का आपका संपूर्ण साथी",
    "Services": "सेवाएँ",
    "My Railway Dashboard": "मेरा रेलवे डैशबोर्ड",
    "Railway Updates": "रेलवे अपडेट",
    "About": "परिचय",
    "About Rail Darpan": "रेल दर्पण के बारे में",
    "YOUR JOURNEY, MADE SIMPLER": "आपकी यात्रा, अब और आसान",
    "Indian Railways, ": "भारतीय रेलवे, ",
    "all in one place.": "अब एक ही जगह पर।",
    "Indian Railways, all in one place.": "भारतीय रेलवे, अब एक ही जगह पर।",
    "Check your PNR status, follow live train movements, explore train schedules and stay informed about railway updates — all from one simple portal.": "अपना PNR स्टेटस देखें, ट्रेनों की लाइव स्थिति जानें, समय-सारणी देखें और रेलवे अपडेट की जानकारी एक ही पोर्टल पर पाएं।",
    "Train information depends on available data services. Verify important travel updates with official railway sources.": "ट्रेन की जानकारी उपलब्ध डेटा सेवाओं पर निर्भर करती है। यात्रा से पहले महत्वपूर्ण अपडेट आधिकारिक रेलवे स्रोतों से जाँचें।",

    "PNR Status": "PNR स्थिति",
    "Live Train Status": "ट्रेन की लाइव स्थिति",
    "Train Schedule": "ट्रेन समय-सारणी",
    "Check your PNR status": "अपनी PNR स्थिति देखें",
    "Enter your 10-digit PNR number to check your booking details.": "अपनी टिकट बुकिंग की जानकारी देखने के लिए 10 अंकों का PNR नंबर दर्ज करें।",
    "PNR Number": "PNR नंबर",
    "Enter 10-digit PNR": "10 अंकों का PNR दर्ज करें",
    "Check PNR →": "PNR जाँचें →",
    "Recent PNR History": "हाल की PNR खोज",
    "Your recent PNR searches on this browser will appear here.": "इस ब्राउज़र में आपकी हाल की PNR खोज यहाँ दिखाई देंगी।",
    "Clear History": "इतिहास मिटाएँ",

    "My Railway Dashboard": "मेरा रेलवे डैशबोर्ड",
    "Your favourite trains, saved stations and recent searches in one place.": "आपकी पसंदीदा ट्रेनें, सेव किए गए स्टेशन और हाल की खोजें एक ही जगह।",
    "Favourite Trains": "पसंदीदा ट्रेनें",
    "Saved Stations": "सेव किए गए स्टेशन",
    "Recent Train Searches": "हाल की ट्रेन खोज",
    "Your dashboard data is saved in this browser on this device. Clearing browser storage will remove these saved items.": "आपका डैशबोर्ड डेटा इसी डिवाइस के ब्राउज़र में सेव होता है। ब्राउज़र स्टोरेज मिटाने पर सेव की गई जानकारी हट जाएगी।",
    "No favourite trains yet. Save a train from its result.": "अभी कोई पसंदीदा ट्रेन नहीं है। ट्रेन के परिणाम से उसे सेव करें।",
    "No saved stations yet. Save a station from Station Search.": "अभी कोई स्टेशन सेव नहीं है। स्टेशन खोज से स्टेशन सेव करें।",
    "Your successful train searches will appear here.": "आपकी सफल ट्रेन खोज यहाँ दिखाई देंगी।",

    "Railway services": "रेलवे सेवाएँ",
    "Essential train information, together in one place.": "ट्रेन से जुड़ी ज़रूरी जानकारी एक ही जगह।",
    "Check booking status and allotted coach or berth details when provided by the data service.": "उपलब्ध होने पर बुकिंग स्थिति, कोच और बर्थ की जानकारी देखें।",
    "Look up a train's reported running status and delays when live data is available.": "लाइव डेटा उपलब्ध होने पर ट्रेन की चलने की स्थिति और देरी देखें।",
    "Explore scheduled stops and timings using the train number.": "ट्रेन नंबर से निर्धारित स्टेशन और समय देखें।",
    "Station Information": "स्टेशन की जानकारी",
    "Find station information and live departures or arrivals when supported.": "स्टेशन की जानकारी और उपलब्ध लाइव आगमन या प्रस्थान देखें।",
    "Disruptions & Alerts": "ट्रेन व्यवधान और अलर्ट",
    "Explore official railway announcements about cancellations, diversions, rescheduling and blocks.": "ट्रेन रद्द होने, मार्ग बदलने, समय बदलने और ब्लॉक से जुड़ी घोषणाएँ देखें।",
    "Railway News": "रेलवे समाचार",
    "Follow railway announcements with publication dates and links to their original sources.": "रेलवे घोषणाएँ उनकी तारीख और मूल स्रोत के लिंक के साथ देखें।",

    "Station Explorer": "स्टेशन एक्सप्लोरर",
    "Search Indian railway stations and check available live information.": "भारतीय रेलवे स्टेशनों को खोजें और उपलब्ध लाइव जानकारी देखें।",
    "Trains Between Stations": "दो स्टेशनों के बीच ट्रेनें",
    "Find available trains between your source and destination.": "अपने शुरुआती और गंतव्य स्टेशन के बीच उपलब्ध ट्रेनें खोजें।",
    "From Station Code": "शुरुआती स्टेशन कोड",
    "To Station Code": "गंतव्य स्टेशन कोड",
    "Example: NDLS": "उदाहरण: NDLS",
    "Example: MMCT": "उदाहरण: MMCT",
    "Journey Date": "यात्रा की तारीख",
    "Find Trains →": "ट्रेनें खोजें →",
    "Search station codes using Station Search below. Train availability depends on the railway data provider.": "नीचे स्टेशन सर्च से स्टेशन कोड खोजें। ट्रेनों की उपलब्धता प्राप्त डेटा पर निर्भर करती है।",
    "Station name or keyword": "स्टेशन का नाम या शब्द",
    "For example, Delhi or New Delhi": "उदाहरण: दिल्ली या नई दिल्ली",
    "Search Stations →": "स्टेशन खोजें →",
    "Station code": "स्टेशन कोड",
    "For example, DLI": "उदाहरण: DLI",
    "Hours to check": "कितने घंटे की जानकारी",
    "Next 2 hours": "अगले 2 घंटे",
    "Next 4 hours": "अगले 4 घंटे",
    "Next 8 hours": "अगले 8 घंटे",
    "Next 12 hours": "अगले 12 घंटे",
    "Next 24 hours": "अगले 24 घंटे",
    "Check Station →": "स्टेशन जाँचें →",

    "TRAIN DISRUPTION SEARCH": "ट्रेन व्यवधान खोज",
    "Train Running Status & Alerts": "ट्रेन की स्थिति और अलर्ट",
    "Search a train number or train name to check its status.": "ट्रेन की स्थिति जानने के लिए ट्रेन नंबर या नाम खोजें।",
    "Railway News & Official Updates": "रेलवे समाचार और आधिकारिक अपडेट",
    "Indian Railways की घोषणाएँ और महत्वपूर्ण अपडेट आधिकारिक स्रोतों से देखें।": "भारतीय रेलवे की घोषणाएँ और महत्वपूर्ण अपडेट आधिकारिक स्रोतों से देखें।",
    "Ministry of Railways News": "रेल मंत्रालय के समाचार",
    "रेलवे की योजनाएँ, नई घोषणाएँ, सुरक्षा और यात्री सुविधाओं से जुड़ी प्रेस रिलीज़।": "रेलवे की योजनाएँ, नई घोषणाएँ, सुरक्षा और यात्री सुविधाओं से जुड़ी प्रेस विज्ञप्तियाँ।",
    "View Official News →": "आधिकारिक समाचार देखें →",
    "Railway Board": "रेलवे बोर्ड",
    "रेलवे बोर्ड की आधिकारिक वेबसाइट पर निर्देश, दस्तावेज़ और विभागीय जानकारी देखें।": "रेलवे बोर्ड की आधिकारिक वेबसाइट पर निर्देश, दस्तावेज़ और विभागीय जानकारी देखें।",
    "Visit Railway Board →": "रेलवे बोर्ड वेबसाइट देखें →",
    "Railway Recruitment": "रेलवे भर्ती",
    "भर्ती से जुड़े नोटिस, परीक्षा और परिणाम के लिए आधिकारिक RRB पोर्टल देखें।": "भर्ती नोटिस, परीक्षा और परिणाम के लिए आधिकारिक RRB पोर्टल देखें।",
    "Visit RRB Portal →": "RRB पोर्टल देखें →",
    "Railway updates": "रेलवे अपडेट",
    "Verified information matters. Live news integration will be added in a later step.": "सत्यापित जानकारी महत्वपूर्ण है। लाइव समाचार सेवा आगे जोड़ी जाएगी।",
    "Official railway announcements": "रेलवे की आधिकारिक घोषणाएँ",
    "Updates will appear here after a reliable source is connected. This page does not yet fetch live news.": "विश्वसनीय स्रोत जुड़ने के बाद अपडेट यहाँ दिखाई देंगे। इस पेज पर अभी लाइव समाचार उपलब्ध नहीं हैं।",
    "Before you travel": "यात्रा से पहले",
    "For urgent changes, confirm train running information and notices through official Indian Railways channels.": "महत्वपूर्ण बदलावों के लिए ट्रेन की स्थिति और सूचनाएँ आधिकारिक भारतीय रेलवे माध्यमों से जाँचें।",
    "Rail Darpan is an independent railway information portal concept. It is not an official Indian Railways or IRCTC website. Information availability and accuracy depend on connected data providers.": "रेल दर्पण एक स्वतंत्र रेलवे सूचना पोर्टल है। यह भारतीय रेलवे या IRCTC की आधिकारिक वेबसाइट नहीं है। जानकारी की उपलब्धता और सटीकता जुड़े डेटा स्रोतों पर निर्भर करती है।",
    "Independent information portal • Not affiliated with Indian Railways or IRCTC.": "स्वतंत्र सूचना पोर्टल • भारतीय रेलवे या IRCTC से संबद्ध नहीं।",

    "Loading…": "लोड हो रहा है…",
    "Loading official railway news…": "रेलवे समाचार लोड हो रहे हैं…",
    "Checking official news updates…": "आधिकारिक समाचार अपडेट जाँचे जा रहे हैं…",
    "Checking for the latest official news…": "नवीनतम आधिकारिक समाचार जाँचे जा रहे हैं…",
    "No news items are available right now.": "अभी कोई समाचार उपलब्ध नहीं है।",
    "Read official update →": "आधिकारिक अपडेट पढ़ें →",
    "No records available.": "कोई रिकॉर्ड उपलब्ध नहीं है।",
    "Not available": "उपलब्ध नहीं",
    "Not provided": "जानकारी उपलब्ध नहीं",
    "Not found": "नहीं मिला",
    "Search": "खोजें",
    "Searching…": "खोज जारी है…",
    "Find berth": "बर्थ खोजें",
    "Find a seat / berth number": "सीट / बर्थ नंबर खोजें",
    "Choose coach capacity": "कोच की क्षमता चुनें",
    "Close seat layout": "सीट लेआउट बंद करें",
    "Exact seat map unavailable": "सटीक सीट मैप उपलब्ध नहीं है",
    "View coach details": "कोच की जानकारी देखें",
    "Coach position": "कोच की स्थिति",
    "COACH ORDER": "कोच क्रम",
    "HALT": "ठहराव",
    "Journey overview": "यात्रा का विवरण",
    "Day-wise journey timeline": "दिन के अनुसार यात्रा समयरेखा",
    "Running days": "चलने के दिन",
    "No station route was included in this schedule response.": "इस समय-सारणी में स्टेशन मार्ग की जानकारी शामिल नहीं है।",
    "FROM": "से",
    "TO": "तक",
    "FROM STATION": "शुरुआती स्टेशन",
    "TO STATION": "गंतव्य स्टेशन",
    "Next stopping stations · halt · platform": "अगले ठहराव स्टेशन · रुकने का समय · प्लेटफ़ॉर्म",
    "Scrollable train route": "स्क्रॉल करके ट्रेन का मार्ग देखें",
    "Train currently travelling between stations": "ट्रेन अभी दो स्टेशनों के बीच चल रही है",
    "Train currently reported at this station": "ट्रेन इस स्टेशन पर बताई गई है",
    "No favourite trains yet. Save a train from its result.": "अभी कोई पसंदीदा ट्रेन नहीं है। परिणाम से ट्रेन सेव करें।",
    "No saved stations yet. Save a station from Station Search.": "अभी कोई स्टेशन सेव नहीं है। स्टेशन खोज से सेव करें।",
    "Your successful train searches will appear here.": "आपकी सफल ट्रेन खोज यहाँ दिखेंगी।",

    "Please enter a valid 10-digit PNR number.": "कृपया सही 10 अंकों का PNR नंबर दर्ज करें।",
    "Please enter a valid train number.": "कृपया सही ट्रेन नंबर दर्ज करें।",
    "Fetching railway information…": "रेलवे की जानकारी प्राप्त की जा रही है…",
    "Unable to retrieve railway information.": "रेलवे की जानकारी प्राप्त नहीं हो सकी।",
    "No recent PNR searches yet.": "अभी कोई हाल की PNR खोज नहीं है।",
    "No trains found.": "कोई ट्रेन नहीं मिली।",
    "View station status": "स्टेशन की स्थिति देखें",
    "Live Status": "लाइव स्थिति",
    "Live Station Board": "लाइव स्टेशन बोर्ड",
    "arrivals": "आगमन",
    "departures": "प्रस्थान",
    "Arrivals": "आगमन",
    "Departures": "प्रस्थान",
    "Runs on": "इन दिनों चलती है",
    "Last updated:": "अंतिम अपडेट:",
    "Last updated": "अंतिम अपडेट",
    "Train disruption information": "ट्रेन व्यवधान की जानकारी",
    "No disruption exception is currently reported for this journey date. Train running status and timetable are shown below. Please verify critical journey information on official NTES before travel.": "इस यात्रा तारीख के लिए अभी कोई व्यवधान दर्ज नहीं है। नीचे ट्रेन की स्थिति और समय-सारणी दी गई है। यात्रा से पहले महत्वपूर्ण जानकारी आधिकारिक NTES पर जाँचें।",
    "Train route & station timings": "ट्रेन का मार्ग और स्टेशन का समय",
    "Search Train": "ट्रेन खोजें",
    "Train number or train name": "ट्रेन नंबर या ट्रेन का नाम",
    "Journey start date": "यात्रा शुरू होने की तारीख",
    "Enter a train number or train name.": "ट्रेन नंबर या ट्रेन का नाम दर्ज करें।",
    "No matching train was found. Check the train number or name.": "इससे मेल खाती ट्रेन नहीं मिली। ट्रेन नंबर या नाम जाँचें।",
    "Select the matching train": "सही ट्रेन चुनें",
    "Train details and live running status are loading…": "ट्रेन की जानकारी और लाइव स्थिति लोड हो रही है…",
    "Train search karke uska running status, disruption information aur station-wise timetable dekhein.": "ट्रेन खोजकर उसकी चलने की स्थिति, व्यवधान और स्टेशन के अनुसार समय-सारणी देखें।",
    "Data source: RailRadar independent railway-data provider. Provider timestamp:": "डेटा अपडेट समय:",
    "TRAIN STATUS": "ट्रेन की स्थिति",
    "Delay:": "देरी:",
    "Tracking mode": "ट्रैकिंग स्थिति",
    "Current location": "वर्तमान स्थान",
    "Next halt": "अगला ठहराव",
    "Train route & station timings": "ट्रेन का मार्ग और स्टेशन का समय",
    "Station": "स्टेशन",
    "Arrival": "आगमन",
    "Departure": "प्रस्थान",
    "Delay": "देरी",
    "Platform": "प्लेटफ़ॉर्म",
    "Status": "स्थिति",
    "Scheduled": "निर्धारित",
    "Expected": "अनुमानित",
    "Actual": "वास्तविक",
    "On Time": "समय पर",
    "Yet to start from its source": "स्रोत स्टेशन से अभी रवाना नहीं हुई",
    "Reached destination": "गंतव्य पर पहुँच गई",
    "Running": "चल रही है",
    "Cancelled": "रद्द",
    "Partially Cancelled": "आंशिक रूप से रद्द",
    "Diverted": "मार्ग परिवर्तित",
    "Rescheduled": "पुनर्निर्धारित",
    "DISRUPTION NOTICE": "व्यवधान सूचना",
    "at station": "स्टेशन पर",
    "upcoming": "आगामी",
    "completed": "यात्रा पूरी",
    "not started": "अभी रवाना नहीं हुई",
    "not-started": "अभी रवाना नहीं हुई",
    "at-station": "स्टेशन पर",
    "pass through": "बिना रुके गुज़रती है",
    "Pass-through": "बिना रुके गुज़रती है",
    "Source not available": "शुरुआती स्टेशन उपलब्ध नहीं",
    "Destination not available": "गंतव्य स्टेशन उपलब्ध नहीं",
    "No station route included in this schedule response.": "इस समय-सारणी में स्टेशन मार्ग शामिल नहीं है।",

    "Train No.": "ट्रेन नंबर",
    "Train Number": "ट्रेन नंबर",
    "Train name": "ट्रेन का नाम",
    "Train Name": "ट्रेन का नाम",
    "PNR:": "PNR:",
    "Code:": "कोड:",
    "Runs:": "चलने के दिन:",
    "Item ": "आइटम ",
    "DAY ": "दिन ",
    "Booking Status": "बुकिंग स्थिति",
    "Current Status": "वर्तमान स्थिति",
    "Chart Status": "चार्ट स्थिति",
    "Confirmed": "कन्फर्म",
    "Waiting List": "प्रतीक्षा सूची",
    "Waitlisted": "प्रतीक्षा सूची",
    "RAC": "RAC",
    "Not Available": "उपलब्ध नहीं",
    "Origin": "शुरुआती स्टेशन",
    "Destination": "गंतव्य स्टेशन",
    "Distance": "दूरी",
    "Duration": "अवधि",
    "Fare": "किराया",
    "Class": "श्रेणी",
    "Quota": "कोटा",
    "Coach": "कोच",
    "Berth": "बर्थ",
    "Seat": "सीट",
    "Sequence": "क्रम",
    "Type": "प्रकार",
    "Name": "नाम",
    "Updated At": "अपडेट समय",
    "Platform Number": "प्लेटफ़ॉर्म नंबर",
    "Guides": "गाइड",
    "Railway Guides": "रेलवे गाइड",
    "About Us": "हमारे बारे में",
    "Privacy Policy": "गोपनीयता नीति",
    "Terms & Conditions": "नियम और शर्तें",
    "Contact Us": "संपर्क करें",
    "Read the detailed About Rail Darpan page →": "रेल दर्पण का विस्तृत परिचय पढ़ें →"
  };

  const HI_PATTERNS = [
    [/^(\s*)(\d+)\s+trains received(\s*)$/i, (_, a, n, z) => `${a}${n} ट्रेनें प्राप्त हुईं${z}`],
    [/^(\s*)(\d+)\s+arrivals(\s*)$/i, (_, a, n, z) => `${a}${n} आगमन${z}`],
    [/^(\s*)(\d+)\s+departures(\s*)$/i, (_, a, n, z) => `${a}${n} प्रस्थान${z}`],
    [/^(\s*)Train\s+(\d+)(\s*)$/i, (_, a, n, z) => `${a}ट्रेन ${n}${z}`],
    [/^(\s*)Item\s+(\d+)(\s*)$/i, (_, a, n, z) => `${a}आइटम ${n}${z}`],
    [/^(\s*)DAY\s+(\d+)(\s*)$/i, (_, a, n, z) => `${a}दिन ${n}${z}`],
    [/^(\s*)(\d+)\s+min late(\s*)$/i, (_, a, n, z) => `${a}${n} मिनट देरी से${z}`],
    [/^(\s*)(\d+)\s+minutes late(\s*)$/i, (_, a, n, z) => `${a}${n} मिनट देरी से${z}`],
    [/^(\s*)Next\s+(\d+)\s+hours(\s*)$/i, (_, a, n, z) => `${a}अगले ${n} घंटे${z}`]
  ];

  const ATTRS = ["placeholder", "aria-label", "title"];

  let language = "en";
  const originalText = new WeakMap();
  const translatedText = new WeakMap();
  const originalAttrs = new WeakMap();
  const translatedAttrs = new WeakMap();

  function readLanguage() {
    try {
      return localStorage.getItem(STORAGE_KEY) === "hi" ? "hi" : "en";
    } catch (_) {
      return "en";
    }
  }

  function translateValue(value, lang) {
    if (lang !== "hi" || !value) return value;

    const leading = (value.match(/^\s*/) || [""])[0];
    const trailing = (value.match(/\s*$/) || [""])[0];
    const core = value.slice(leading.length, value.length - trailing.length);

    if (Object.prototype.hasOwnProperty.call(HI, core)) {
      return leading + HI[core] + trailing;
    }

    for (const [pattern, replacement] of HI_PATTERNS) {
      if (pattern.test(value)) return value.replace(pattern, replacement);
    }

    let output = value;
    const entries = Object.entries(HI).sort((a, b) => b[0].length - a[0].length);

    for (const [english, hindi] of entries) {
      if (english.length < 4 || english.trim() !== english) continue;
      const escaped = english.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      output = output.replace(new RegExp(escaped, "gi"), hindi);
    }

    return output;
  }

  function shouldSkipText(node) {
    const parent = node.parentElement;
    if (!parent) return true;

    if (parent.closest(
      "script,style,noscript,code,pre,textarea,[data-rd-no-translate]," +
      ".rd-ntes-train-title,.rd-ntes-station-name,.rd-ntes-station-code," +
      ".rd-ntes-route-title,.station-train-name,.station-train-route," +
      ".rd-live-coach-code,.rd-live-route-stop-name,.rd-live-route-stop-code"
    )) return true;

    return false;
  }

  function translateTextNode(node) {
    if (shouldSkipText(node)) return;

    const current = node.nodeValue;
    let source = originalText.get(node);
    const previousOutput = translatedText.get(node);

    if (source === undefined || current !== previousOutput) {
      source = current;
      originalText.set(node, source);
    }

    const output = translateValue(source, language);
    translatedText.set(node, output);

    if (current !== output) node.nodeValue = output;
  }

  function translateAttribute(element, attr) {
    if (!element.hasAttribute(attr)) return;

    let store = originalAttrs.get(element);
    let outputStore = translatedAttrs.get(element);

    if (!store) {
      store = {};
      originalAttrs.set(element, store);
    }

    if (!outputStore) {
      outputStore = {};
      translatedAttrs.set(element, outputStore);
    }

    const current = element.getAttribute(attr);
    if (store[attr] === undefined || current !== outputStore[attr]) {
      store[attr] = current;
    }

    const output = translateValue(store[attr], language);
    outputStore[attr] = output;

    if (current !== output) element.setAttribute(attr, output);
  }

  function translateTree(root) {
    if (!root) return;

    if (root.nodeType === Node.TEXT_NODE) {
      translateTextNode(root);
      return;
    }

    if (root.nodeType === Node.ELEMENT_NODE) {
      ATTRS.forEach(attr => translateAttribute(root, attr));
    }

    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT
    );

    let node;
    while ((node = walker.nextNode())) {
      translateTextNode(node);
    }

    if (root.querySelectorAll) {
      root.querySelectorAll("*").forEach(element => {
        ATTRS.forEach(attr => translateAttribute(element, attr));
      });
    }
  }

  function updateLanguageButtons() {
    document.documentElement.lang = language === "hi" ? "hi" : "en";

    document.querySelectorAll("[data-rd-language]").forEach(button => {
      const active = button.dataset.rdLanguage === language;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function setLanguage(nextLanguage) {
    language = nextLanguage === "hi" ? "hi" : "en";

    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch (_) {}

    updateLanguageButtons();
    translateTree(document.body);
  }

  function createLanguageControl() {
    const nav = document.querySelector("header nav");
    if (!nav || document.getElementById("rdLanguageControl")) return;

    const style = document.createElement("style");
    style.id = "rdLanguageControlStyle";
    style.textContent = `
      .rd-language-control {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        padding: 3px;
        margin-left: 8px;
        border: 1px solid rgba(148,163,184,.45);
        border-radius: 10px;
        background: rgba(255,255,255,.10);
        flex-shrink: 0;
      }
      .rd-language-control button {
        border: 0;
        border-radius: 7px;
        padding: 7px 10px;
        color: inherit;
        background: transparent;
        font: inherit;
        font-size: 12px;
        font-weight: 750;
        cursor: pointer;
      }
      .rd-language-control button.is-active {
        color: #fff;
        background: #1769bd;
      }
      @media(max-width:760px) {
        .rd-language-control {
          margin: 8px 0 0;
        }
      }
    `;
    document.head.appendChild(style);

    const group = document.createElement("div");
    group.id = "rdLanguageControl";
    group.className = "rd-language-control";
    group.setAttribute("role", "group");
    group.setAttribute("aria-label", "Choose language");

    [
      { code: "en", label: "EN" },
      { code: "hi", label: "हिंदी" }
    ].forEach(item => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.rdLanguage = item.code;
      button.textContent = item.label;
      button.addEventListener("click", () => setLanguage(item.code));
      group.appendChild(button);
    });

    nav.appendChild(group);
    updateLanguageButtons();
  }

  function init() {
    language = readLanguage();
    createLanguageControl();
    translateTree(document.body);
    updateLanguageButtons();

    const observer = new MutationObserver(records => {
      for (const record of records) {
        if (record.type === "characterData") {
          translateTextNode(record.target);
          continue;
        }

        if (record.type === "attributes") {
          if (ATTRS.includes(record.attributeName)) {
            translateAttribute(record.target, record.attributeName);
          }
          continue;
        }

        record.addedNodes.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE) translateTextNode(node);
          else if (node.nodeType === Node.ELEMENT_NODE) translateTree(node);
        });
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATTRS
    });

    window.RailDarpanLanguage = {
      get: () => language,
      set: setLanguage,
      translate: value => translateValue(String(value ?? ""), language)
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
