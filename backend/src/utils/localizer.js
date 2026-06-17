const translations = {
  en: {
    welcome: "Welcome back, {name}!",
    auth_success: "Authentication successful.",
    register_success: "User registered successfully.",
    profile_not_found: "Financial profile not found. Please create one.",
    profile_updated: "Financial profile updated successfully.",
    profile_created: "Financial profile created successfully.",
    loan_created: "Loan '{name}' added successfully.",
    loan_updated: "Loan details updated successfully.",
    loan_deleted: "Loan deleted successfully.",
    expense_created: "Expense of {amount} in {category} added successfully.",
    expense_updated: "Expense details updated successfully.",
    expense_deleted: "Expense deleted successfully.",
    savings_goal_created: "Savings goal '{title}' created successfully.",
    savings_goal_updated: "Savings goal updated successfully.",
    savings_goal_deleted: "Savings goal deleted successfully.",
    invalid_credentials: "Invalid email or password.",
    email_exists: "Email address is already in use.",
    unauthorized: "Not authorized to access this resource.",
    server_error: "Internal server error occurred.",
    bad_request: "Invalid input data provided.",
    resource_not_found: "Requested resource could not be found.",
    rate_limit_exceeded: "Too many requests, please try again later."
  },
  te: {
    welcome: "తిరిగి స్వాగతం, {name}!",
    auth_success: "ధృవీకరణ విజయవంతమైంది.",
    register_success: "వినియోగదారు విజయవంతంగా నమోదు చేయబడ్డారు.",
    profile_not_found: "ఆర్థిక ప్రొఫైల్ కనుగొనబడలేదు. దయచేసి ఒకదాన్ని సృష్టించండి.",
    profile_updated: "ఆర్థిక ప్రొఫైల్ విజయవంతంగా నవీకరించబడింది.",
    profile_created: "ఆర్థిక ప్రొఫైల్ విజయవంతంగా సృష్టించబడింది.",
    loan_created: "రుణం '{name}' విజయవంతంగా జోడించబడింది.",
    loan_updated: "రుణ వివరాలు విజయవంతంగా నవీకరించబడ్డాయి.",
    loan_deleted: "రుణం విజయవంతంగా తొలగించబడింది.",
    expense_created: "{category} విభాగంలో {amount} ఖర్చు విజయవంతంగా జోడించబడింది.",
    expense_updated: "ఖర్చు వివరాలు విజయవంతంగా నవీకరించబడ్డాయి.",
    expense_deleted: "ఖర్చు విజయవంతంగా తొలగించబడింది.",
    savings_goal_created: "పొదుపు లక్ష్యం '{title}' విజయవంతంగా సృష్టించబడింది.",
    savings_goal_updated: "పొదుపు లక్ష్యం విజయవంతంగా నవీకరించబడింది.",
    savings_goal_deleted: "పొదుపు లక్ష్యం విజయవంతంగా తొలగించబడింది.",
    invalid_credentials: "చెల్లని ఇమెయిల్ లేదా పాస్‌వర్డ్.",
    email_exists: "ఈ ఇమెయిల్ చిరునామా ఇప్పటికే వాడుకలో ఉంది.",
    unauthorized: "ఈ వనరును యాక్సెస్ చేయడానికి మీకు అనుమతి లేదు.",
    server_error: "అంతర్గత సర్వర్ లోపం సంభవించింది.",
    bad_request: "చెల్లని ఇన్పుట్ డేటా అందించబడింది.",
    resource_not_found: "అభ్యర్థించిన వనరు కనుగొనబడలేదు.",
    rate_limit_exceeded: "చాలా అభ్యర్థనలు పంపారు, దయచేసి కాసేపటి తర్వాత మళ్లీ ప్రయత్నించండి."
  },
  hi: {
    welcome: "आपका स्वागत है, {name}!",
    auth_success: "प्रमाणीकरण सफल रहा।",
    register_success: "उपयोगकर्ता सफलतापूर्वक पंजीकृत हो गया है।",
    profile_not_found: "वित्तीय प्रोफ़ाइल नहीं मिली। कृपया एक बनाएं।",
    profile_updated: "वित्तीय प्रोफ़ाइल सफलतापूर्वक अपडेट हो गई।",
    profile_created: "वित्तीय प्रोफ़ाइल सफलतापूर्वक बन गई।",
    loan_created: "ऋण '{name}' सफलतापूर्वक जोड़ा गया।",
    loan_updated: "ऋण विवरण सफलतापूर्वक अपडेट किए गए।",
    loan_deleted: "ऋण सफलतापूर्वक हटा दिया गया।",
    expense_created: "{category} श्रेणी में {amount} का खर्च सफलतापूर्वक जोड़ा गया।",
    expense_updated: "खर्च विवरण सफलतापूर्वक अपडेट किए गए।",
    expense_deleted: "खर्च सफलतापूर्वक हटा दिया गया।",
    savings_goal_created: "बचत लक्ष्य '{title}' सफलतापूर्वक बनाया गया।",
    savings_goal_updated: "बचत लक्ष्य सफलतापूर्वक अपडेट किया गया।",
    savings_goal_deleted: "बचत लक्ष्य सफलतापूर्वक हटा दिया गया।",
    invalid_credentials: "अमान्य ईमेल या पासवर्ड।",
    email_exists: "यह ईमेल पता पहले से ही उपयोग में है।",
    unauthorized: "इस संसाधन तक पहुँचने के लिए अधिकृत नहीं हैं।",
    server_error: "आंतरिक सर्वर त्रुटि उत्पन्न हुई।",
    bad_request: "अमान्य इनपुट डेटा प्रदान किया गया।",
    resource_not_found: "अनुरोधित संसाधन नहीं मिला।",
    rate_limit_exceeded: "बहुत सारे अनुरोध, कृपया बाद में पुनः प्रयास करें।"
  },
  ta: {
    welcome: "மீண்டும் வருக, {name}!",
    auth_success: "அங்கீகாரம் வெற்றிகரமாக முடிந்தது.",
    register_success: "பயனர் வெற்றிகரமாக பதிவு செய்யப்பட்டார்.",
    profile_not_found: "நிதி சுயவிவரம் கண்டறியப்படவில்லை. தயவுசெய்து ஒன்றை உருவாக்கவும்.",
    profile_updated: "நிதி சுயவிவரம் வெற்றிகரமாக புதுப்பிக்கப்பட்டது.",
    profile_created: "நிதி சுயவிவரம் வெற்றிகரமாக உருவாக்கப்பட்டது.",
    loan_created: "கடன் '{name}' வெற்றிகரமாக சேர்க்கப்பட்டது.",
    loan_updated: "கடன் விவரங்கள் வெற்றிகரமாக புதுப்பிக்கப்பட்டன.",
    loan_deleted: "கடன் வெற்றிகரமாக நீக்கப்பட்டது.",
    expense_created: "{category} பிரிவில் {amount} செலவு வெற்றிகரமாக சேர்க்கப்பட்டது.",
    expense_updated: "செலவு விவரங்கள் வெற்றிகரமாக புதுப்பிக்கப்பட்டன.",
    expense_deleted: "செலவு வெற்றிகரமாக நீக்கப்பட்டது.",
    savings_goal_created: "சேமிப்பு இலக்கு '{title}' வெற்றிகரமாக உருவாக்கப்பட்டது.",
    savings_goal_updated: "சேமிப்பு இலக்கு வெற்றிகரமாக புதுப்பிக்கப்பட்டது.",
    savings_goal_deleted: "சேமிப்பு இலக்கு வெற்றிகரமாக நீக்கப்பட்டது.",
    invalid_credentials: "தவறான மின்னஞ்சல் அல்லது கடவுச்சொல்.",
    email_exists: "இந்த மின்னஞ்சல் முகவரி ஏற்கனவே பயன்பாட்டில் உள்ளது.",
    unauthorized: "இந்த வளத்தை அணுக உங்களுக்கு அங்கீகாரம் இல்லை.",
    server_error: "உள் சர்வர் பிழை ஏற்பட்டது.",
    bad_request: "தவறான உள்ளீட்டு தரவு வழங்கப்பட்டுள்ளது.",
    resource_not_found: "கோரப்பட்ட வளம் கண்டறியப்படவில்லை.",
    rate_limit_exceeded: "அதிகப்படியான கோரிக்கைகள், தயவுசெய்து சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்."
  }
};

const getLocale = (req) => {
  // 1. Check user language if authenticated
  if (req.user && req.user.preferredLanguage) {
    return req.user.preferredLanguage;
  }
  
  // 2. Check query parameter lang
  if (req.query && req.query.lang && translations[req.query.lang]) {
    return req.query.lang;
  }

  // 3. Check Accept-Language header
  if (req.headers && req.headers['accept-language']) {
    const headerLang = req.headers['accept-language'].split(',')[0].substring(0, 2).toLowerCase();
    if (translations[headerLang]) {
      return headerLang;
    }
  }

  return 'en'; // default
};

const translate = (req, key, params = {}) => {
  const locale = getLocale(req);
  const dict = translations[locale] || translations['en'];
  let message = dict[key] || translations['en'][key] || key;

  // Replace placeholders like {name} or {amount}
  Object.keys(params).forEach((placeholder) => {
    message = message.replace(new RegExp(`{${placeholder}}`, 'g'), params[placeholder]);
  });

  return message;
};

module.exports = {
  translate,
  getLocale
};
