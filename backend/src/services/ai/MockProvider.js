const AIProvider = require('./AIProvider');

class MockProvider extends AIProvider {
  /**
   * Generates qualitative explanations of the precalculated scores and forecasts.
   * Tailored dynamically based on the user's intent (DEBT_REDUCTION, SAVINGS, etc.) and preferred language.
   */
  async generateFinancialAdvice(payload) {
    const {
      userQuestion,
      intent = 'GENERAL',
      language = 'en'
    } = payload;

    const q = userQuestion ? userQuestion.toLowerCase().trim() : '';
    if (q.includes('why did my recovery score increase') || q.includes('why did my score increase') || q.includes('why did my recovery score change')) {
      const isEnglish = language === 'en';
      const isTelugu = language === 'te';
      const isHindi = language === 'hi';
      const isTamil = language === 'ta';

      let answer = "Your score increased because your monthly income was updated, reducing your DTI ratio and improving your cash surplus.";
      let explanation = "Recovery Score is computed based on DTI Ratio and cash surplus. By updating monthly income, DTI ratio decreases and cash surplus increases, directly resulting in a higher overall recovery score.";
      
      if (isTelugu) {
        answer = "మీ నెలవారీ ఆదాయం అప్‌డేట్ చేయబడినందున మీ స్కోర్ పెరిగింది, దీనివల్ల మీ DTI నిష్పత్తి తగ్గి మీ నగదు మిగులు పెరిగింది.";
        explanation = "DTI నిష్పత్తి మరియు నగదు మిగులు ఆధారంగా రికవరీ స్కోర్ లెక్కించబడుతుంది. నెలవారీ ఆదాయాన్ని అప్‌డేట్ చేయడం ద్వారా, DTI నిష్పత్తి తగ్గి, నగదు మిగులు పెరుగుతుంది, దీనివల్ల నేరుగా మొత్తం రికవరీ స్కోర్ పెరుగుతుంది.";
      } else if (isHindi) {
        answer = "मासिक आय अपडेट होने से आपका स्कोर बढ़ गया है, जिससे आपका डीटीआई (DTI) अनुपात कम हो गया है और आपका नकद अधिशेष बढ़ गया है।";
        explanation = "रिकवरी स्कोर की गणना डीटीआई (DTI) अनुपात और नकद अधिशेष के आधार पर की जाती है। मासिक आय को अपडेट करने से, डीटीआई अनुपात कम हो जाता है और नकद अधिशेष बढ़ जाता है, जिसके सीधे परिणामस्वरूप समग्र रिकवरी स्कोर अधिक होता है।";
      } else if (isTamil) {
        answer = "உங்கள் மாதாந்திர வருமானம் புதுப்பிக்கப்பட்டதால் உங்கள் மதிப்பெண் அதிகரித்துள்ளது, இது உங்கள் DTI விகிதத்தைக் குறைத்து உங்கள் பண உபரியை மேம்படுத்துகிறது.";
        explanation = "DTI விகிதம் மற்றும் பண உபரி ஆகியவற்றின் அடிப்படையில் மீட்பு மதிப்பெண் கணக்கிடப்படுகிறது. மாதாந்திர வருமானத்தைப் புதுப்பிப்பதன் மூலம், DTI விகிதம் குறைகிறது மற்றும் பண உபரி அதிகரிக்கிறது, இது நேரடியாக ஒட்டுமொத்த மீட்பு மதிப்பெண்ணை உயர்த்துகிறது.";
      }

      return {
        provider: 'mock',
        intent,
        directAnswer: answer,
        summary: answer,
        calculationExplanation: explanation,
        recommendations: isEnglish ? ["Maintain updated profile values", "Accelerate remaining loan payments"] : isTelugu ? ["నవీకరించబడిన ప్రొఫైల్ విలువలను నిర్వహించండి", "మిగిలిన రుణ చెల్లింపులను వేగవంతం చేయండి"] : isHindi ? ["अपडेटेड प्रोफाइल मान बनाए रखें", "शेष ऋण भुगतानों में तेजी लाएं"] : ["புதுப்பிக்கப்பட்ட சுயவிவர மதிப்புகளைப் பராமரிக்கவும்", "மீதமுள்ள கடன் செலுத்துதலை துரிதப்படுத்தவும்"],
        warnings: [],
        budgetingTips: isEnglish ? ["Continue tracking your cash surplus"] : isTelugu ? ["మీ నగదు మిగులును ట్రాక్ చేయడం కొనసాగించండి"] : isHindi ? ["अपने नकद अधिशेष को ट्रैक करना जारी रखें"] : ["உங்கள் பண உபரியைத் தொடர்ந்து கண்காணிக்கவும்"],
        nextActions: isEnglish ? ["Check the detailed factors in the recovery score page"] : isTelugu ? ["రికవరీ స్కోర్ పేజీలో వివరణాత్మక అంశాలను తనిఖీ చేయండి"] : isHindi ? ["रिकवरी स्कोर पेज में विस्तृत कारकों की जांच करें"] : ["மீட்பு மதிப்பெண் பக்கத்தில் உள்ள விரிவான காரணிகளைச் சரிபார்க்கவும்"]
      };
    }

    // Support both old financialMetrics shape and new profile shape
    const financialMetrics = payload.financialMetrics || payload.profile || {};
    const recoveryScore = typeof payload.recoveryScore === 'object'
      ? payload.recoveryScore.score
      : (payload.recoveryScore || 50);
    const debtForecast = payload.debtForecast || {};
    const simulatorResults = payload.simulatorResults || {};

    const lang = ['en', 'te', 'hi', 'ta'].includes(language) ? language : 'en';

    // Extract pre-calculated values
    const scoreVal = recoveryScore || 50;
    let category = 'Recovering';
    if (scoreVal <= 30) category = 'Critical';
    else if (scoreVal <= 50) category = 'High Risk';
    else if (scoreVal <= 70) category = 'Recovering';
    else if (scoreVal <= 85) category = 'Stable';
    else category = 'Excellent';

    // Localized categories
    const categoryTranslation = {
      en: { Critical: 'Critical', 'High Risk': 'High Risk', Recovering: 'Recovering', Stable: 'Stable', Excellent: 'Excellent' },
      te: { Critical: 'తీవ్రమైన ప్రమాదం', 'High Risk': 'అధిక ప్రమాదం', Recovering: 'కోలుకుంటుంది', Stable: 'స్థిరంగా ఉంది', Excellent: 'అద్భుతమైనది' },
      hi: { Critical: 'गंभीर', 'High Risk': 'उच्च जोखिम', Recovering: 'सुधर रहा है', Stable: 'स्थिर', Excellent: 'उत्कृष्ट' },
      ta: { Critical: 'மிகவும் ஆபத்தான', 'High Risk': 'அதிக ஆபத்து', Recovering: 'மீண்டு வருகிறது', Stable: 'நிலையான', Excellent: 'மிகவும் சிறப்பான' }
    };

    const displayCategory = categoryTranslation[lang][category] || category;

    const remainingDebt = financialMetrics?.remainingDebt || 0;
    const surplus = financialMetrics?.surplus || 0;
    const income = financialMetrics?.income || 0;
    const expenses = financialMetrics?.expenses || 0;
    const dti = financialMetrics?.dti || 0;

    const payoffMonths = debtForecast?.payoffMonthsRemaining || 0;
    const recommendedPayment = debtForecast?.recommendedMonthlyPayment || 0;
    const targetDate = debtForecast?.estimatedDebtFreeDate 
      ? new Date(debtForecast.estimatedDebtFreeDate).toLocaleDateString()
      : 'N/A';

    const simMonthsReduced = simulatorResults?.monthsReduced || 0;
    const simInterestSaved = simulatorResults?.interestSaved || 0;
    const simProposedEmi = simulatorResults?.proposedEmi || 0;

    // Multilingual response dictionaries per intent
    const intentDictionary = {
      DEBT_REDUCTION: {
        en: {
          summary: `To tackle your outstanding principal debt of Rs. ${remainingDebt.toLocaleString()}, you should adopt an accelerated repayment strategy. Focusing extra money on the highest interest rate loan (Avalanche method) or clearing the smallest balance first (Snowball method) will yield results.`,
          recommendations: [
            `Prioritize paying off high-interest loans first to save the most interest.`,
            `Apply your current monthly surplus of Rs. ${surplus.toLocaleString()} towards your targeted debt.`,
            `Do not take on any new credit cards or fresh personal loans.`
          ],
          warnings: [
            `Missing any active EMI payment will trigger payment compliance drops.`,
            `Accumulating new debt while paying off existing loans will extend your payoff timeline.`
          ],
          budgetingTips: [
            `Automate your EMI payments directly on your pay day.`,
            `Allocate 20% of your budget strictly to debt reduction.`
          ]
        },
        te: {
          summary: `మీ రూ. ${remainingDebt.toLocaleString()} అసలు అప్పును తగ్గించుకోవడానికి, మీరు అదనపు చెల్లింపుల వ్యూహాన్ని అమలు చేయాలి. అధిక వడ్డీ గల రుణాన్ని ముందుగా చెల్లించడం (అవలాంచ్ పద్ధతి) లేదా చిన్న అప్పులను ముందుగా తీర్చడం (స్నోబాల్ పద్ధతి) మీకు సహాయపడుతుంది.`,
          recommendations: [
            `వడ్డీని ఆదా చేయడానికి ముందుగా అధిక వడ్డీ గల రుణాలపై దృష్టి పెట్టండి.`,
            `మీ ప్రస్తుత నెలవారీ మిగులు రూ. ${surplus.toLocaleString()} ని అప్పుల చెల్లింపునకు కేటాయించండి.`,
            `కొత్త క్రెడిట్ కార్డులు లేదా వ్యక్తిగత లోన్లు తీసుకోవద్దు.`
          ],
          warnings: [
            `ఏదైనా ఈఎంఐ చెల్లింపును తప్పిస్తే మీ క్రెడిట్ స్కోరు తీవ్రంగా దెబ్బతింటుంది.`,
            `అప్పులు తీరుస్తున్నప్పుడు కొత్త అప్పులు చేస్తే రుణవిముక్తి కాలపరిమితి పెరుగుతుంది.`
          ],
          budgetingTips: [
            `మీ జీతం వచ్చే రోజునే ఈఎంఐలు ఆటో-డెబిట్ అయ్యేలా సెట్ చేసుకోండి.`,
            `మీ బడ్జెట్‌లో 20% భాగాన్ని ఖచ్చితంగా అప్పుల చెల్లింపునకే కేటాయించండి.`
          ]
        },
        hi: {
          summary: `आपकी रु. ${remainingDebt.toLocaleString()} की बकाया ऋण राशि को कम करने के लिए, आपको त्वरित भुगतान रणनीति अपनानी चाहिए। सबसे अधिक ब्याज वाले ऋण को पहले चुकाना (अवालांच विधि) या सबसे छोटे ऋण को पहले चुकाना (स्नोबॉल विधि) अच्छे परिणाम देगा।`,
          recommendations: [
            `अधिक ब्याज बचाने के लिए सबसे पहले उच्च ब्याज वाले ऋणों को चुकाने पर ध्यान दें।`,
            `अपने वर्तमान मासिक अधिशेष (सरप्लस) रु. ${surplus.toLocaleString()} को ऋण भुगतान में लगाएं।`,
            `कोई भी नया क्रेडिट कार्ड या नया पर्सनल लोन लेने से बचें।`
          ],
          warnings: [
            `किसी भी सक्रिय ईएमआई को मिस करने से आपका सुधार स्कोर काफी गिर जाएगा।`,
            `ऋण चुकाने के दौरान नए ऋण लेने से आपकी ऋण-मुक्ति की अवधि बढ़ जाएगी।`
          ],
          budgetingTips: [
            `अपनी सैलरी के दिन ही ईएमआई भुगतान को ऑटो-डेबिट पर सेट करें।`,
            `अपने बजट का कम से कम 20% हिस्सा विशेष रूप से ऋण चुकाने के लिए रखें।`
          ]
        },
        ta: {
          summary: `உங்களது ரூ. ${remainingDebt.toLocaleString()} நிலுவையில் உள்ள கடன் தொகையைக் குறைக்க, நீங்கள் விரைவான திருப்பிச் செலுத்தும் முறையைப் பின்பற்ற வேண்டும். அதிக வட்டி கொண்ட கடனை முதலில் அடைப்பது (அவலாஞ்ச் முறை) அல்லது சிறிய கடனை முதலில் முடிப்பது (ஸ்னோபால் முறை) பயனுள்ளதாக இருக்கும்.`,
          recommendations: [
            `வட்டிச் செலவைச் சேமிக்க அதிக வட்டி கொண்ட கடன்களுக்கு முன்னுரிமை கொடுங்கள்.`,
            `உங்களது மாதாந்திர உபரித் தொகையான ரூ. ${surplus.toLocaleString()}-ஐ கடன் அடைப்பிற்குப் பயன்படுத்துங்கள்.`,
            `புதிய கடன்களையோ கிரெடிட் கார்டுகளையோ முற்றிலும் தவிர்க்கவும்.`
          ],
          warnings: [
            `மாதாந்திர தவணைகளைத் தவறவிட்டால் உங்களது நிதி மதிப்பெண் கடுமையாகப் பாதிக்கப்படும்.`,
            `கடன் அடைக்கும் காலத்தில் புதிய கடன்களை வாங்குவது கடன் இல்லா நாளாக மாறுவதை தள்ளிப்போடும்.`
          ],
          budgetingTips: [
            `சம்பளம் வரும் நாளன்றே உங்களது தவணைகள் தானாகக் கழியும் வசதியை ஏற்படுத்துங்கள்.`,
            `பட்ஜெட்டில் 20%-ஐ கடனை அடைக்க பிரத்தியேகமாக ஒதுக்குங்கள்.`
          ]
        }
      },
      SAVINGS: {
        en: {
          summary: `Your monthly income is Rs. ${income.toLocaleString()} and expenses are Rs. ${expenses.toLocaleString()}, resulting in a surplus of Rs. ${surplus.toLocaleString()}. To save more, optimize your recurring expenses and build a stable emergency fund.`,
          recommendations: [
            `Target an emergency fund of Rs. ${(expenses * 3).toLocaleString()} to cover at least 3 months of expenses.`,
            `Review subscription models and dining out habits to reduce discretionary expenses.`,
            `Adopt a zero-based budgeting strategy at the start of each month.`
          ],
          warnings: [
            `Having less than a 3-month savings buffer leaves you vulnerable to sudden financial shocks.`,
            `Do not invest your emergency cash in volatile assets.`
          ],
          budgetingTips: [
            `Apply the 50/30/20 budget rule: 50% Needs, 30% Wants, 20% Savings/Debt payoff.`,
            `Track daily minor cash flow outlays to reveal hidden savings potential.`
          ]
        },
        te: {
          summary: `మీ నెలవారీ ఆదాయం రూ. ${income.toLocaleString()} మరియు ఖర్చులు రూ. ${expenses.toLocaleString()}, దీనివల్ల రూ. ${surplus.toLocaleString()} మిగులు ఉంది. మరింత పొదుపు చేయడానికి, అనవసర ఖర్చులను తగ్గించుకోండి మరియు అత్యవసర నిధిని ఏర్పాటు చేసుకోండి.`,
          recommendations: [
            `కనీసం 3 నెలల ఖర్చుల కోసం రూ. ${(expenses * 3).toLocaleString()} అత్యవసర నిధిని లక్ష్యంగా పెట్టుకోండి.`,
            `నెలవారీ సబ్‌స్క్రిప్షన్లు మరియు బయట తినే ఖర్చులను తగ్గించుకోండి.`,
            `ప్రతి నెల ప్రారంభంలోనే జీరో-బేస్డ్ బడ్జెట్ ప్రణాళికను తయారు చేసుకోండి.`
          ],
          warnings: [
            `3 నెలల ఖర్చులకు సరిపడా అత్యవసర నిధి లేకపోతే అత్యవసర పరిస్థితుల్లో ఇబ్బంది పడాల్సి వస్తుంది.`,
            `అత్యవసర నిధి డబ్బును నష్టభయం ఉన్న షేర్లలో లేదా మ్యూచువల్ ఫండ్లలో పెట్టవద్దు.`
          ],
          budgetingTips: [
            `50/30/20 బడ్జెట్ సూత్రాన్ని పాటించండి: 50% అవసరాలు, 30% కోరికలు, 20% పొదుపు లేదా అప్పుల చెల్లింపు.`,
            `దాగి ఉన్న పొదుపు అవకాశాలను తెలుసుకోవడానికి రోజువారీ చిన్న ఖర్చులపై నిఘా ఉంచండి.`
          ]
        },
        hi: {
          summary: `आपकी मासिक आय रु. ${income.toLocaleString()} और खर्च रु. ${expenses.toLocaleString()} है, जिससे रु. ${surplus.toLocaleString()} का अधिशेष बचता है। बचत बढ़ाने के लिए, आवर्ती खर्चों को कम करें और एक आपातकालीन कोष (इमरजेंसी फंड) बनाएं।`,
          recommendations: [
            `कम से कम 3 महीने के खर्चों को कवर करने के लिए रु. ${(expenses * 3).toLocaleString()} का आपातकालीन फंड बनाएं।`,
            `बाहर खाने और अनावश्यक सब्सक्रिप्शन खर्चों को कम करें।`,
            `प्रत्येक महीने की शुरुआत में शून्य-आधारित (जीरो-बेस्ड) बजट अपनाएं।`
          ],
          warnings: [
            `3 महीने से कम का आपातकालीन फंड होना आपको वित्तीय संकटों के प्रति संवेदनशील बनाता है।`,
            `आपातकालीन फंड की राशि को जोखिम वाले निवेशों में न लगाएं।`
          ],
          budgetingTips: [
            `50/30/20 नियम लागू करें: 50% जरूरतें, 30% इच्छाएं, 20% बचत और ऋण भुगतान।`,
            `दैनिक छोटे खर्चों को ट्रैक करें ताकि छिपी हुई बचत का पता चल सके।`
          ]
        },
        ta: {
          summary: `உங்களது மாதாந்திர வருமானம் ரூ. ${income.toLocaleString()} மற்றும் செலவுகள் ரூ. ${expenses.toLocaleString()} ஆகும், இதனால் ரூ. ${surplus.toLocaleString()} உபரி உள்ளது. சேமிப்பை அதிகரிக்க, தேவையில்லாத செலவுகளைக் குறைத்து, அவசர கால நிதியை உருவாக்குங்கள்.`,
          recommendations: [
            `குறைந்தது 3 மாத செலவுகளுக்கு இணையான ரூ. ${(expenses * 3).toLocaleString()} அவசர கால நிதியாக உருவாக்குங்கள்.`,
            `தேவையற்ற மாதாந்திர சந்தாக்கள் மற்றும் வெளியே உணவருந்தும் செலவுகளைக் குறைக்கவும்.`,
            `ஒவ்வொரு மாத தொடக்கத்திலும் பூஜ்ஜிய அடிப்படையிலான பட்ஜெட்டைத் திட்டமிடுங்கள்.`
          ],
          warnings: [
            `குறைந்தது 3 மாத சேமிப்பு இல்லாவிட்டால் எதிர்பாராத நிதி நெருக்கடிகள் ஏற்படும்போது கடன் வாங்க நேரிடும்.`,
            `அவசர கால நிதித் தொகையை அதிக நஷ்ட ஆபத்து உள்ள பங்குகளில் முதலீடு செய்யாதீர்கள்.`
          ],
          budgetingTips: [
            `50/30/20 விதியைப் பின்பற்றுங்கள்: 50% தேவைகள், 30% விருப்பங்கள், 20% சேமிப்பு/கடன் அடைப்பு.`,
            `உங்களது சிறு செலவுகளைத் தினமும் கண்காணிப்பது சேமிப்பை அதிகரிக்க உதவும்.`
          ]
        }
      },
      RECOVERY_SCORE: {
        en: {
          summary: `Your Financial Recovery Score is ${scoreVal} out of 100, placing you in the "${displayCategory}" range. This rating reflects your debt levels, cash flow security, and payment discipline.`,
          recommendations: [
            `Lower your Debt-to-Income (DTI) ratio (currently ${dti}%) by accelerating repayment.`,
            `Keep your active credit utilization ratio below 30% at all times.`,
            `Maintain a perfect record of on-time EMI repayments to build dynamic score points.`
          ],
          warnings: scoreVal <= 50 ? [
            `Your score is in a high-risk zone. New loans will be rejected or carry high interest rates.`,
            `Focus entirely on financial recovery before committing to any new liabilities.`
          ] : [
            `Stay disciplined. Even one missed installment can drop your score significantly.`
          ],
          budgetingTips: [
            `Setting up auto-debit triggers for loans prevents forgotten bills.`,
            `A higher score is built by having a solid cash surplus and low active debt.`
          ]
        },
        te: {
          summary: `మీ ఆర్థిక పునరుద్ధరణ స్కోరు 100 కి ${scoreVal}, ఇది మిమ్మల్ని "${displayCategory}" శ్రేణిలో ఉంచుతుంది. ఈ రేటింగ్ మీ అప్పుల స్థాయిలు, నగదు ప్రవాహ భద్రత మరియు చెల్లింపు క్రమశిక్షణను ప్రతిబింబిస్తుంది.`,
          recommendations: [
            `అప్పులను త్వరగా చెల్లించడం ద్వారా మీ రుణ-ఆదాయ నిష్పత్తి (DTI - ప్రస్తుతం ${dti}%) తగ్గించుకోండి.`,
            `మీ క్రెడిట్ వినియోగ నిష్పత్తిని ఎల్లప్పుడూ 30% కంటే తక్కువగా ఉంచండి.`,
            `స్కోరు పెరగడానికి ఈఎంఐ చెల్లింపులను ఎల్లప్పుడూ సమయానికి చెల్లించండి.`
          ],
          warnings: scoreVal <= 50 ? [
            `మీ స్కోరు ప్రమాదకర స్థాయిలో ఉంది. కొత్త లోన్లు లభించడం కష్టం లేదా అధిక వడ్డీకి లభిస్తాయి.`,
            `కొత్త అప్పులు చేయడానికి ముందు ప్రస్తుత అప్పులను తీర్చడంపైనే దృష్టి పెట్టండి.`
          ] : [
            `క్రమశిక్షణతో ఉండండి. ఒక ఈఎంఐ చెల్లింపు ఆలస్యమైనా మీ స్కోరు పడిపోతుంది.`
          ],
          budgetingTips: [
            `ఈఎంఐలను ఆటో-డెబిట్ చేయడం వల్ల బిల్లులు మర్చిపోయే అవకాశం ఉండదు.`,
            `ఎక్కువ నగదు మిగులు మరియు తక్కువ అప్పులు ఉండటం వల్ల స్కోరు వేగంగా పెరుగుతుంది.`
          ]
        },
        hi: {
          summary: `आपका वित्तीय सुधार स्कोर 100 में से ${scoreVal} है, जो आपको "${displayCategory}" श्रेणी में रखता है। यह रेटिंग आपके ऋण स्तर, नकदी प्रवाह सुरक्षा और भुगतान अनुशासन को दर्शाती है।`,
          recommendations: [
            `ऋण भुगतान तेज करके अपने ऋण-से-आय (DTI) अनुपात (वर्तमान में ${dti}%) को कम करें।`,
            `अपनी क्रेडिट उपयोग सीमा को हमेशा 30% से नीचे रखें।`,
            `स्कोर बढ़ाने के लिए ईएमआई का हमेशा समय पर भुगतान सुनिश्चित करें।`
          ],
          warnings: scoreVal <= 50 ? [
            `आपका स्कोर उच्च जोखिम वाले क्षेत्र में है। नए लोन अस्वीकृत हो सकते हैं या उन पर भारी ब्याज लग सकता है।`,
            `नई देनदारियां शुरू करने से पहले पूरी तरह से वित्तीय सुधार पर ध्यान केंद्रित करें।`
          ] : [
            `अनुशासन बनाए रखें। एक भी ईएमआई चूकने से आपका स्कोर काफी कम हो सकता है।`
          ],
          budgetingTips: [
            `लोन के लिए ऑटो-डेबिट सेट करने से भुगतान भूलने की समस्या नहीं होगी।`,
            `ठोस नकद अधिशेष और कम ऋण होने से वित्तीय सुधार स्कोर मजबूत होता है।`
          ]
        },
        ta: {
          summary: `உங்களது நிதி மீட்சி மதிப்பெண் 100-க்கு ${scoreVal} ஆகும், இது உங்களை "${displayCategory}" பிரிவில் வைக்கிறது. இந்த மதிப்பெண் உங்களது கடன் அளவுகள், பணப்புழக்கப் பாதுகாப்பு மற்றும் தவணை செலுத்தும் ஒழுங்குமுறையைக் காட்டுகிறது.`,
          recommendations: [
            `கடன்களை வேகமாக அடைப்பதன் மூலம் உங்களது கடன்-வருவாய் (DTI) விகிதத்தை (தற்போது ${dti}%) குறையுங்கள்.`,
            `உங்களது கடன் பயன்பாட்டு அளவை எப்போதும் 30% க்குக் குறைவாக வைத்திருங்கள்.`,
            `தவணைகளைத் துல்லியంగాச் செலுத்துவது உங்களது மதிப்பெண்ணை உயர்த்தும் முக்கிய காரணியாகும்.`
          ],
          warnings: scoreVal <= 50 ? [
            `உங்களது மதிப்பெண் ஆபத்தான நிலையில் உள்ளது. புதிய கடன்கள் நிராகரிக்கப்படலாம் அல்லது அதிக வட்டி விதிக்கப்படலாம்.`,
            `புதிய கடன்களை வாங்கும் முன்பு இருக்கும் கடன்களை அடைப்பதில் கவனம் செலுத்துங்கள்.`
          ] : [
            `கவனமாக இருங்கள். ஒரு தவணையைத் தவறவிட்டால் கூட உங்களது மதிப்பெண் கணிசமாகக் குறையும்.`
          ],
          budgetingTips: [
            `தவணைகளுக்கு ஆட்டோ-டெபிட் வசதியை ஏற்படுத்துவது தவணைகளை மறப்பதைத் தடுக்கும்.`,
            `அதிக பண உபரி மற்றும் குறைவான கடன் ஆகியவை நிதி மீட்சி மதிப்பெண்ணை அதிகரிக்கும்.`
          ]
        }
      },
      FORECAST: {
        en: {
          summary: `According to our backend forecast engine, you have ${payoffMonths} months remaining before you become debt-free. Your estimated debt-free date is ${targetDate}, based on keeping a recommended monthly payment target of Rs. ${recommendedPayment.toLocaleString()}.`,
          recommendations: [
            `Commit strictly to the recommended monthly payment of Rs. ${recommendedPayment.toLocaleString()} to meet the date.`,
            `Direct any windfalls, bonuses, or cash gifts directly to principal debt to shorten this date.`,
            `Avoid extending loan tenures or doing restructuring unless cash flow is completely blocked.`
          ],
          warnings: [
            `If you pay only the minimum EMIs, you will accrue more interest and extend the debt-free date.`,
            `Increasing monthly expenses will compress your surplus and put this target date at risk.`
          ],
          budgetingTips: [
            `Keep a countdown of remaining payoff months to maintain psychology and focus.`,
            `Review your budget categories quarterly to capture leaks and put extra cash towards the forecast.`
          ]
        },
        te: {
          summary: `మా లెక్కల ప్రకారం, మీరు అప్పుల నుండి విముక్తి పొందడానికి ఇంకా ${payoffMonths} నెలలు పడుతుంది. మీరు ప్రతి నెల సిఫార్సు చేసిన రూ. ${recommendedPayment.toLocaleString()} చెల్లింపును పాటిస్తే, మీ రుణ విముక్తి తేదీ ${targetDate} అవుతుంది.`,
          recommendations: [
            `లక్ష్య తేదీని చేరుకోవడానికి సిఫార్సు చేసిన నెలవారీ చెల్లింపు రూ. ${recommendedPayment.toLocaleString()} కు కట్టుబడి ఉండండి.`,
            `వచ్చే అదనపు బోనస్‌లు లేదా బహుమతి డబ్బును నేరుగా అప్పుల అసలు చెల్లింపునకే మళ్లించి కాలపరిమితిని తగ్గించండి.`,
            `నగదు కొరత తీవ్రంగా ఉంటే తప్ప రుణాల కాలపరిమితిని పెంచుకోవద్దు.`
          ],
          warnings: [
            `మీరు కేవలం కనీస ఈఎంఐ మాత్రమే చెల్లిస్తే, ఎక్కువ వడ్డీ భారం పడుతుంది మరియు రుణ విముక్తి తేదీ ఆలస్యమవుతుంది.`,
            `నెలవారీ ఖర్చులు పెరిగితే మిగులు బడ్జెట్ తగ్గి రుణ విముక్తి లక్ష్యం దెబ్బతింటుంది.`
          ],
          budgetingTips: [
            `ఉత్సాహంగా ముందుకు సాగడానికి మిగిలి ఉన్న రుణ చెల్లింపు నెలలను కౌంట్‌డౌన్ లాగా ట్రాక్ చేయండి.`,
            `బడ్జెట్ లోపాలను సరిదిద్దడానికి ప్రతి మూడు నెలలకొకసారి మీ ఖర్చులను సమీక్షించుకోండి.`
          ]
        },
        hi: {
          summary: `हमारे पूर्वानुमान इंजन के अनुसार, आपके पास ऋण-मुक्त होने के लिए ${payoffMonths} महीने शेष हैं। रु. ${recommendedPayment.toLocaleString()} के अनुशंसित मासिक भुगतान को बनाए रखने पर आपकी संभावित ऋण-मुक्ति तिथि ${targetDate} है।`,
          recommendations: [
            `लक्ष्य तिथि तक पहुंचने के लिए रु. ${recommendedPayment.toLocaleString()} के अनुशंसित मासिक भुगतान का पालन करें।`,
            `किसी भी अतिरिक्त आय या बोनस को सीधे ऋण के मूलधन को चुकाने में लगाएं ताकि अवधि कम हो सके।`,
            `जब तक बहुत जरूरी न हो, लोन की अवधि बढ़ाने या पुनर्गठन (रीस्ट्रक्चरिंग) से बचें।`
          ],
          warnings: [
            `यदि आप केवल न्यूनतम ईएमआई का भुगतान करते हैं, तो ब्याज अधिक लगेगा और ऋण-मुक्ति की तिथि आगे बढ़ जाएगी।`,
            `मासिक खर्च बढ़ने से आपका मासिक सरप्लस कम होगा जिससे ऋण-मुक्ति की तिथि प्रभावित होगी।`
          ],
          budgetingTips: [
            `प्रेरित रहने के लिए शेष ऋण-मुक्त महीनों का रिकॉर्ड रखें।`,
            `बजट की कमियों को दूर करने और अतिरिक्त बचत खोजने के लिए हर तिमाही खर्चों की समीक्षा करें।`
          ]
        },
        ta: {
          summary: `எங்களது கணக்கீட்டின்படி, நீங்கள் கடன் இல்லாதவராக மாற இன்னும் ${payoffMonths} மாதங்கள் உள்ளன. மாதாந்திர பரிந்துரைக்கப்பட்ட தவணைத் தொகையான ரூ. ${recommendedPayment.toLocaleString()}-ஐச் செலுத்தினால், உங்களது கடன் இல்லா நாளாக ${targetDate} கணிக்கப்பட்டுள்ளது.`,
          recommendations: [
            `பரிந்துரைக்கப்பட்ட மாதாந்திர தவணையான ரூ. ${recommendedPayment.toLocaleString()}-ஐத் தவறாமல் செலுத்துங்கள்.`,
            `கிடைக்கும் கூடுதல் போனஸ் அல்லது பரிசுத் தொகைகளை நேரடியாக அசல் தொகையை அடைக்கப் பயன்படுத்தி காலத்தைக் குறையுங்கள்.`,
            `பண நெருக்கடி மிக அதிகமாக இருந்தால் தவிர கடன்களின் தவணைக் காலத்தை நீட்டிக்க வேண்டாம்.`
          ],
          warnings: [
            `குறைந்தபட்ச தவணையை மட்டும் செலுத்தினால் அதிக வட்டி கட்ட வேண்டியிருக்கும் மற்றும் கடன் இல்லா நாளும் தள்ளிப்போகும்.`,
            `மாதாந்திர செலவுகள் அதிகரித்தால் பண உபரி குறைந்து கடன் இல்லா நாளாக மாறுவதை தள்ளிப்போடும்.`
          ],
          budgetingTips: [
            `கடன் அடைக்கும் காலத்தைக் கண்காணிப்பது உங்களது மன உறுதியை அதிகரிக்க உதவும்.`,
            `பட்ஜெட் கசிவுகளைக் கண்டறிந்து கூடுதல் பணத்தைச் சேமிக்க மூன்று மாதங்களுக்கு ஒருமுறை பட்ஜெட்டைச் சரிபார்க்கவும்.`
          ]
        }
      },
      SIMULATOR: {
        en: {
          summary: `Our simulator shows that by increasing your monthly EMI to proposed target levels (Proposed EMI: Rs. ${simProposedEmi.toLocaleString()}), you can save Rs. ${simInterestSaved.toLocaleString()} in interest costs and shave ${simMonthsReduced} months off your loan tenure.`,
          recommendations: [
            `If your cash flow surplus allows, commit to this accelerated proposed payment immediately.`,
            `Put the saved months of tenure toward building solid investments or wealth.`,
            `Ensure your emergency fund is healthy before redirecting extra surplus to proposed EMI targets.`
          ],
          warnings: [
            `Do not push proposed EMIs to a level that squeezes your monthly cash surplus below zero.`,
            `Simulator projections hold only if all monthly payments are made consistently.`
          ],
          budgetingTips: [
            `Even an incremental increase of Rs. 1,000 or 2,000 on high-interest loans produces exponential long-term interest savings.`,
            `Review your simulator calculations whenever a loan interest rate changes.`
          ]
        },
        te: {
          summary: `మా సిమ్యులేటర్ చూపిస్తున్నట్లుగా, మీ నెలవారీ ఈఎంఐని రూ. ${simProposedEmi.toLocaleString()} కు పెంచడం ద్వారా, మీరు రూ. ${simInterestSaved.toLocaleString()} వడ్డీని ఆదా చేయవచ్చు మరియు రుణ కాలపరిమితిని ${simMonthsReduced} నెలలు తగ్గించుకోవచ్చు.`,
          recommendations: [
            `మీ బడ్జెట్ మిగులు అనుమతిస్తే, వెంటనే ఈ అదనపు ఈఎంఐ చెల్లింపును ప్రారంభించండి.`,
            `ఆదా అయిన రుణ కాలపరిమితి సమయాన్ని మంచి పెట్టుబడులు పెట్టడానికి ఉపయోగించుకోండి.`,
            `ఈఎంఐ పెంచే ముందు మీ అత్యవసర నిధి భద్రంగా ఉందో లేదో చూసుకోండి.`
          ],
          warnings: [
            `నెలవారీ బడ్జెట్ మిగులు సున్నా కంటే కిందకు పడిపోయేలా ఈఎంఐను పెంచుకోవద్దు.`,
            `నెలవారీ చెల్లింపులు క్రమం తప్పకుండా చేస్తేనే ఈ సిమ్యులేటర్ ఫలితాలు నిజమవుతాయి.`
          ],
          budgetingTips: [
            `అధిక వడ్డీ రుణాలపై నెలకు రూ. 1,000 లేదా 2,000 అదనంగా చెల్లించినా దీర్ఘకాలంలో భారీగా వడ్డీ ఆదా అవుతుంది.`,
            `వడ్డీ రేట్లు మారినప్పుడల్లా సిమ్యులేటర్ ద్వారా మీ కొత్త ఆదాను లెక్కించుకోండి.`
          ]
        },
        hi: {
          summary: `हमारे सिम्युलेटर से पता चलता है कि अपनी ईएमआई को प्रस्तावित स्तर (प्रस्तावित ईएमआई: रु. ${simProposedEmi.toLocaleString()}) तक बढ़ाकर, आप ब्याज लागत में रु. ${simInterestSaved.toLocaleString()} बचा सकते हैं और लोन की अवधि को ${simMonthsReduced} महीने कम कर सकते हैं।`,
          recommendations: [
            `यदि आपका नकद अधिशेष अनुमति देता है, तो इस प्रस्तावित त्वरित भुगतान को तुरंत अपनाएं।`,
            `बचे हुए महीनों की अवधि का उपयोग ठोस निवेश करने में करें।`,
            `प्रस्तावित ईएमआई बढ़ाने से पहले सुनिश्चित करें कि आपका आपातकालीन फंड पर्याप्त है।`
          ],
          warnings: [
            `प्रस्तावित ईएमआई को उस स्तर तक न बढ़ाएं जिससे आपका मासिक नकद अधिशेष शून्य से नीचे चला जाए।`,
            `सिम्युलेटर के परिणाम तभी मान्य होंगे जब सभी भुगतान लगातार किए जाएं।`
          ],
          budgetingTips: [
            `उच्च ब्याज वाले ऋणों पर प्रति माह केवल रु. 1,000 या 2,000 की अतिरिक्त वृद्धि भी लंबी अवधि में भारी ब्याज बचाती है।`,
            `जब भी ऋण की ब्याज दरें बदलें, सिम्युलेटर पर अपनी बचत का दोबारा मूल्यांकन करें।`
          ]
        },
        ta: {
          summary: `எங்களது சிமுலேட்டர் காட்டுவது என்னவென்றால், உங்களது மாதாந்திர தவணையை ரூ. ${simProposedEmi.toLocaleString()}-ஆக அதிகரிப்பதன் மூலம், நீங்கள் வட்டித் தொகையில் ரூ. ${simInterestSaved.toLocaleString()}-ஐச் சேமிக்கலாம் மற்றும் தவணைக் காலத்தை ${simMonthsReduced} மாதங்களாகக் குறைக்கலாம்.`,
          recommendations: [
            `உங்களது பண உபரி அனுமதித்தால், இந்த விரைவான தவணைத் தொகையை உடனடியாகச் செலுத்தத் தொடங்குங்கள்.`,
            `கடன் காலத்தைக் குறைப்பதன் மூலம் மிச்சமாகும் காலத்தை நல்ல முதலீடுகள் செய்யப் பயன்படுத்துங்கள்.`,
            `கூடுதல் தொகையைத் தவணையாகச் செலுத்தும் முன்பு உங்களது அவசர கால நிதி போதுமானதாக உள்ளதா என்பதை உறுதிப்படுத்துங்கள்.`
          ],
          warnings: [
            `மாதாந்திர பண உபரி பூஜ்ஜியத்திற்குக் கீழே போகும் அளவுக்குத் தவணைத் தொகையை அதிகரிக்க வேண்டாம்.`,
            `தவணைகளைத் தொடர்ந்து செலுத்தினால் மட்டுமே இந்த சிமுலேட்டர் கணிப்புகள் சரியாக இருக்கும்.`
          ],
          budgetingTips: [
            `அதிக வட்டி கடன்களுக்கு மாதம் ரூ. 1,000 அல்லது 2,000 கூடுதலாகச் செலுத்தினாலும் நீண்ட காலத்தில் பெரும் வட்டி மிச்சமாகும்.`,
            `வட்டி விகிதங்கள் மாறும்போது சிமுலேட்டர் கணிப்புகளை மீண்டும் சரிபார்க்கவும்.`
          ]
        }
      },
      EXPLAIN_DASHBOARD: {
        en: {
          summary: `You earn Rs. ${income.toLocaleString()} per month. You currently owe Rs. ${remainingDebt.toLocaleString()} across active loans. You have Rs. ${financialMetrics.savings?.toLocaleString() || 0} in savings and Rs. ${financialMetrics.emergencyFund?.toLocaleString() || 0} reserved for emergencies.`,
          recommendations: [
            `Maintain a low DTI by paying off credit card debts first.`,
            `Build your emergency fund to cover at least 3 months of expenses.`,
            `Continue paying your active EMIs on time to boost your compliance rate.`
          ],
          warnings: [
            dti > 40 ? `Your DTI is high at ${dti.toFixed(1)}%. Keep it below 35% to avoid default risk.` : `Keep monitoring your DTI ratio.`,
            `Ensure all pending expenses are paid before due dates.`
          ],
          budgetingTips: [
            `Set aside 10% of income directly into savings before paying expenses.`,
            `Utilize your actual surplus of Rs. ${surplus.toLocaleString()} to accelerate debt payoff.`
          ],
          calculationExplanation: `1. Current Financial Status:
- Income: Rs. ${income.toLocaleString()}/month
- Debt: Rs. ${remainingDebt.toLocaleString()} across active loans
- Savings: Rs. ${financialMetrics.savings?.toLocaleString() || 0}
- Emergency Fund: Rs. ${financialMetrics.emergencyFund?.toLocaleString() || 0}

2. Recovery Score Explanation:
- Score: ${scoreVal}/100 (${displayCategory})
- Your score is computed based on DTI (${dti.toFixed(1)}%), savings ratio, emergency fund coverage, and payment compliance.

3. DTI Calculation Breakdown:
- Monthly EMI Total = Rs. ${payload.totalEMI || 0}
- Monthly Income = Rs. ${income.toLocaleString()}
- DTI Formula = (Total EMI / Income) * 100
- Math: ${payload.totalEMI || 0} / ${income} * 100 = ${dti.toFixed(1)}%

4. Surplus Breakdown:
- Income: Rs. ${income.toLocaleString()}
- Minus Paid Expenses: Rs. ${(payload.expenseStatus?.paidTotal || 0).toLocaleString()}
- Minus Loan Payments (Total EMI): Rs. ${(payload.totalEMI || 0).toLocaleString()}
- Equals Surplus: Rs. ${surplus.toLocaleString()}`
        },
        te: {
          summary: `మీరు నెలకు రూ. ${income.toLocaleString()} సంపాదిస్తున్నారు. మీ పై క్రియాశీల రుణాల కింద రూ. ${remainingDebt.toLocaleString()} అప్పు ఉంది. మీకు రూ. ${financialMetrics.savings?.toLocaleString() || 0} పొదుపులు మరియు రూ. ${financialMetrics.emergencyFund?.toLocaleString() || 0} అత్యవసర నిధి ఉన్నాయి.`,
          recommendations: [
            `క్రెడిట్ కార్డ్ బాకీలను ముందుగా చెల్లించడం ద్వారా తక్కువ DTIని నిర్వహించండి.`,
            `కనీసం 3 నెలల ఖర్చులను కవర్ చేయడానికి అత్యవసర నిధిని పెంచుకోండి.`,
            `క్రియాశీల ఈఎంఐలను సమయానికి చెల్లించడం కొనసాగించండి.`
          ],
          warnings: [
            dti > 40 ? `మీ DTI ${dti.toFixed(1)}% ఎక్కువగా ఉంది. ప్రమాదాన్ని నివారించడానికి దీనిని 35% కంటే తక్కువగా ఉంచండి.` : `మీ DTI రేషియోను పర్యవేక్షిస్తూ ఉండండి.`,
            `గడువు తేదీల కంటే ముందే పెండింగ్ ఖర్చులను చెల్లించండి.`
          ],
          budgetingTips: [
            `ఖర్చులకు ముందే ఆదాయంలో 10% నేరుగా పొదుపులో ఉంచండి.`,
            `రుణ విముక్తిని వేగవంతం చేయడానికి మీ రూ. ${surplus.toLocaleString()} మిగులును ఉపయోగించండి.`
          ],
          calculationExplanation: `1. ఆర్థిక స్థితి:
- ఆదాయం: రూ. ${income.toLocaleString()}/నెల
- అప్పు: రూ. ${remainingDebt.toLocaleString()}
- పొదుపులు: రూ. ${financialMetrics.savings?.toLocaleString() || 0}
- అత్యవసర నిధి: రూ. ${financialMetrics.emergencyFund?.toLocaleString() || 0}

2. రికవరీ స్కోర్ వివరణ:
- స్కోరు: ${scoreVal}/100 (${displayCategory})
- మీ DTI (${dti.toFixed(1)}%), పొదుపు నిష్పత్తి మరియు అత్యవసర నిధి ఆధారంగా స్కోరు లెక్కించబడింది.

3. DTI లెక్కల వివరణ:
- నెలవారీ ఈఎంఐలు = రూ. ${payload.totalEMI || 0}
- నెలవారీ ఆదాయం = రూ. ${income.toLocaleString()}
- సూత్రం: DTI = (మొత్తం ఈఎంఐ / ఆదాయం) * 100
- లెక్క: ${payload.totalEMI || 0} / ${income} * 100 = ${dti.toFixed(1)}%

4. మిగులు బడ్జెట్ వివరణ:
- ఆదాయం: రూ. ${income.toLocaleString()}
- మైనస్ చెల్లించిన ఖర్చులు: రూ. ${(payload.expenseStatus?.paidTotal || 0).toLocaleString()}
- మైనస్ ఈఎంఐ చెల్లింపులు: రూ. ${(payload.totalEMI || 0).toLocaleString()}
- సమానం మిగులు: రూ. ${surplus.toLocaleString()}`
        },
        hi: {
          summary: `आप प्रति माह रु. ${income.toLocaleString()} कमाते हैं। वर्तमान में आपके पास सक्रिय ऋणों पर रु. ${remainingDebt.toLocaleString()} का बकाया है। आपके पास रु. ${financialMetrics.savings?.toLocaleString() || 0} की बचत है और रु. ${financialMetrics.emergencyFund?.toLocaleString() || 0} आपातकालीन निधि के रूप में सुरक्षित हैं।`,
          recommendations: [
            `क्रेडिट कार्ड ऋणों का भुगतान पहले करके कम DTI बनाए रखें।`,
            `कम से कम 3 महीने के खर्चों को कवर करने के लिए आपातकालीन निधि का निर्माण करें।`,
            `अनुपालन दर बढ़ाने के लिए सक्रिय ईएमआई का समय पर भुगतान जारी रखें।`
          ],
          warnings: [
            dti > 40 ? `आपका DTI ${dti.toFixed(1)}% पर अधिक है। डिफ़ॉल्ट जोखिम से बचने के लिए इसे 35% से नीचे रखें।` : `अपने DTI अनुपात की निगरानी करते रहें।`,
            `सुनिश्चित करें कि सभी लंबित खर्च देय तिथियों से पहले चुकाए जाएं।`
          ],
          budgetingTips: [
            `खर्च करने से पहले आय का 10% सीधे बचत में अलग रखें।`,
            `ऋण भुगतान में तेजी लाने के लिए रु. ${surplus.toLocaleString()} के अपने वास्तविक अधिशेष का उपयोग करें।`
          ],
          calculationExplanation: `1. वर्तमान वित्तीय स्थिति:
- आय: रु. ${income.toLocaleString()}/माह
- ऋण: रु. ${remainingDebt.toLocaleString()} सक्रिय ऋणों पर
- बचत: रु. ${financialMetrics.savings?.toLocaleString() || 0}
- आपातकालीन निधि: रु. ${financialMetrics.emergencyFund?.toLocaleString() || 0}

2. रिकवरी स्कोर विवरण:
- स्कोर: ${scoreVal}/100 (${displayCategory})
- आपका स्कोर DTI (${dti.toFixed(1)}%), बचत अनुपात, आपातकालीन निधि और भुगतान अनुपालन के आधार पर आकलित है।

3. DTI गणना विवरण:
- मासिक कुल ईएमआई = रु. ${payload.totalEMI || 0}
- मासिक आय = रु. ${income.toLocaleString()}
- फॉर्मूला = (कुल ईएमआई / आय) * 100
- गणित: ${payload.totalEMI || 0} / ${income} * 100 = ${dti.toFixed(1)}%

4. अधिशेष (सरप्लस) विवरण:
- आय: रु. ${income.toLocaleString()}
- घटाएं भुगतान किए गए खर्च: रु. ${(payload.expenseStatus?.paidTotal || 0).toLocaleString()}
- घटाएं ऋण भुगतान (कुल ईएमआई): रु. ${(payload.totalEMI || 0).toLocaleString()}
- बराबर अधिशेष: रु. ${surplus.toLocaleString()}`
        },
        ta: {
          summary: `நீங்கள் மாதத்திற்கு ரூ. ${income.toLocaleString()} சம்பாதிக்கிறீர்கள். செயலில் உள்ள கடன்களில் ரூ. ${remainingDebt.toLocaleString()} செலுத்த வேண்டியுள்ளது. உங்களிடம் ரூ. ${financialMetrics.savings?.toLocaleString() || 0} சேமிப்பு மற்றும் ரூ. ${financialMetrics.emergencyFund?.toLocaleString() || 0} அவசரக்கால நிதி உள்ளது.`,
          recommendations: [
            `கிரெடிட் கார்டு கடன்களை முதலில் செலுத்தி குறைந்த DTI-ஐ பராமரிக்கவும்.`,
            `குறைந்தது 3 மாத செலவுகளை சமாளிக்க அவசர நிதியை உருவாக்குங்கள்.`,
            `செயலில் உள்ள தவணைகளை சரியான நேரத்தில் செலுத்தி இணக்க விகிதத்தை உயர்த்தவும்.`
          ],
          warnings: [
            dti > 40 ? `உங்கள் DTI ${dti.toFixed(1)}% அதிகமாக உள்ளது. ஆபத்தைத் தவிர்க்க 35%க்குக் குறைவாக வைக்கவும்.` : `உங்கள் DTI விகிதத்தை தொடர்ந்து கண்காணிக்கவும்.`,
            `நிலுவையில் உள்ள அனைத்து செலவுகளும் உரிய தேதிக்கு முன் செலுத்தப்படுவதை உறுதி செய்யவும்.`
          ],
          budgetingTips: [
            `செலவு செய்யும் முன் வருமானத்தில் 10% சேமிப்பில் ஒதுக்கவும்.`,
            `கடன் அடைப்பை துரிதப்படுத்த உங்கள் ரூ. ${surplus.toLocaleString()} உபரித் தொகையைப் பயன்படுத்தவும்.`
          ],
          calculationExplanation: `1. தற்போதைய நிதி நிலை:
- வருமானம்: ரூ. ${income.toLocaleString()}/மாதம்
- கடன்: ரூ. ${remainingDebt.toLocaleString()}
- சேமிப்பு: ரூ. ${financialMetrics.savings?.toLocaleString() || 0}
- அவசர நிதி: ரூ. ${financialMetrics.emergencyFund?.toLocaleString() || 0}

2. மீட்பு மதிப்பெண் விளக்கம்:
- மதிப்பெண்: ${scoreVal}/100 (${displayCategory})
- உங்கள் மதிப்பெண் DTI (${dti.toFixed(1)}%), சேமிப்பு விகிதம், அவசர நிதி மற்றும் செலுத்துதல் இணக்கத்தின் அடிப்படையில் கணக்கிடப்படுகிறது.

3. DTI கணக்கீடு விளக்கம்:
- மாதாந்திர தவணை மொத்தம் = ரூ. ${payload.totalEMI || 0}
- மாதாந்திர வருமானம் = ரூ. ${income.toLocaleString()}
- சூத்திரம் = (மொத்த தவணை / வருமானம்) * 100
- கணக்கீடு: ${payload.totalEMI || 0} / ${income} * 100 = ${dti.toFixed(1)}%

4. உபரித் தொகை விளக்கம்:
- வருமானம்: ரூ. ${income.toLocaleString()}
- கழித்தல் செலுத்திய செலவுகள்: ரூ. ${(payload.expenseStatus?.paidTotal || 0).toLocaleString()}
- கழித்தல் தவணை தொகைகள்: ரூ. ${(payload.totalEMI || 0).toLocaleString()}
- சமம் உபரி: ரூ. ${surplus.toLocaleString()}`
        }
      },
      GENERAL: {
        en: {
          summary: `You have an outstanding principal debt of Rs. ${remainingDebt.toLocaleString()} with a Financial Recovery Score of ${scoreVal}/100, which falls into the "${displayCategory}" category.`,
          recommendations: [
            `Maintain a structured monthly budget based on income (Rs. ${income.toLocaleString()}) and expenses (Rs. ${expenses.toLocaleString()}).`,
            `Focus on clearing active loans and raising your monthly surplus.`
          ],
          warnings: [
            `Review your budget leaks to avoid taking on more debt.`,
            `Always pay active EMIs on time to prevent default charges.`
          ],
          budgetingTips: [
            `Save a portion of your monthly surplus before starting monthly spendings.`,
            `Examine all interest charges on your accounts.`
          ]
        },
        te: {
          summary: `మీకు రూ. ${remainingDebt.toLocaleString()} అసలు అప్పు ఉంది, మరియు మీ ఆర్థిక పునరుద్ధరణ స్కోరు 100 కి ${scoreVal}, ఇది "${displayCategory}" వర్గంలోకి వస్తుంది.`,
          recommendations: [
            `ఆదాయం (రూ. ${income.toLocaleString()}) మరియు ఖర్చుల (రూ. ${expenses.toLocaleString()}) ఆధారంగా ఒక బడ్జెట్ ప్రణాళికను రూపొందించుకోండి.`,
            `ప్రస్తుత రుణాలను తీర్చడం మరియు నెలవారీ మిగులును పెంచుకోవడంపై దృష్టి పెట్టండి.`
          ],
          warnings: [
            `మరింత అప్పుల ఊబిలో పడకుండా ఉండటానికి మీ బడ్జెట్ ఖర్చులను సమీక్షించండి.`,
            `జరిమానాలు పడకుండా ఉండటానికి ఈఎంఐలను ఎల్లప్పుడూ సమయానికి చెల్లించండి.`
          ],
          budgetingTips: [
            `ఖర్చు చేయడం ప్రారంభించడానికి ముందే మీ నెలవారీ మిగులులో కొంత భాగాన్ని పొదుపు చేసుకోండి.`,
            `మీ రుణాలపై వసూలు చేస్తున్న వడ్డీ ఖర్చులను క్రమం తప్పకుండా గమనించండి.`
          ]
        },
        hi: {
          summary: `आपकी बकाया मूल ऋण राशि रु. ${remainingDebt.toLocaleString()} है और आपका वित्तीय सुधार स्कोर 100 में से ${scoreVal} है, जो "${displayCategory}" श्रेणी में आता है।`,
          recommendations: [
            `मासिक आय (रु. ${income.toLocaleString()}) और खर्च (रु. ${expenses.toLocaleString()}) के आधार पर एक व्यवस्थित बजट का पालन करें।`,
            `सक्रिय ऋणों को चुकाने और अपना मासिक अधिशेष बढ़ाने पर ध्यान केंद्रित करें।`
          ],
          warnings: [
            `नए ऋणों से बचने के लिए अपने बजट में होने वाले फालतू खर्चों की समीक्षा करें।`,
            `अतिरिक्त शुल्कों से बचने के लिए हमेशा समय पर ईएमआई का भुगतान करें।`
          ],
          budgetingTips: [
            `महीने के खर्चे शुरू करने से पहले ही मासिक अधिशेष का एक हिस्सा अलग बचाकर रखें।`,
            `अपने सभी खातों पर लगने वाले ब्याज दरों की समीक्षा करें।`
          ]
        },
        ta: {
          summary: `உங்களது அசல் கடன் தொகை ரூ. ${remainingDebt.toLocaleString()} ஆகும், மற்றும் நிதி மீட்சி மதிப்பெண் 100-க்கு ${scoreVal} ஆகும். இது "${displayCategory}" பிரிவில் அடங்கும்.`,
          recommendations: [
            `வருமானம் (ரூ. ${income.toLocaleString()}) மற்றும் செலவுகள் (ரூ. ${expenses.toLocaleString()}) அடிப்படையில் மாதாந்திர பட்ஜெட்டை உருவாக்குங்கள்.`,
            `இருக்கும் கடன்களை அடைப்பதிலும் மாதாந்திர பண உபரியை அதிகரிப்பதிலும் கவனம் செலுத்துங்கள்.`
          ],
          warnings: [
            `மேலும் கடன் சுமை ஏற்படுவதைத் தவிர்க்க தேவையற்ற செலவுகளைக் கண்காணியுங்கள்.`,
            `தவணை கட்டத் தவறினால் ஏற்படும் கூடுதல் கட்டணங்களைத் தவிர்க்க தவணைகளைச் சரியான நேரத்தில் செலுத்துங்கள்.`
          ],
          budgetingTips: [
            `செலவுகளைத் தொடங்குவதற்கு முன்பே மாதாந்திர உபரித் தொகையில் ஒரு பகுதியைச் சேமித்து வையுங்கள்.`,
            `உங்களது கடன்களுக்கான வட்டி விகிதங்களை ஒப்பிட்டுச் சரிபார்க்கவும்.`
          ]
        }
      }
    };

    // Grab correct text template based on intent and language
    const currentIntent = intentDictionary[intent] ? intent : 'GENERAL';
    const advice = intentDictionary[currentIntent][lang];

    let direct = advice.summary || 'Overview of your current financial situation.';
    if (payload.allExpenses && payload.allExpenses.length > 0) {
      const unpaidList = payload.allExpenses.filter(e => e.paymentStatus !== 'Paid');
      if (unpaidList.length > 0) {
        const disclaimer = unpaidList.map(e => `I see this expense ${e.category} exists but payment has not been confirmed.`).join(' ');
        direct = `${direct} ${disclaimer}`;
      }
    }

    const comp = payload.paymentHistory?.compliancePercent !== undefined ? payload.paymentHistory.compliancePercent : 100;
    const confidence = comp >= 90 ? 'High' : (comp >= 70 ? 'Medium' : 'Low');

    return {
      provider: 'mock',
      intent,
      directAnswer: direct,
      summary: advice.summary || 'Summary of finances.',
      calculationExplanation: advice.calculationExplanation || `Surplus = Income - Paid Expenses - EMI = Rs. ${income.toLocaleString()} - Rs. ${(payload.expenseStatus?.paidTotal || 0).toLocaleString()} - Rs. ${(payload.totalEMI || 0).toLocaleString()} = Rs. ${surplus.toLocaleString()}`,
      recommendations: advice.recommendations || [],
      warnings: advice.warnings || [],
      budgetingTips: advice.budgetingTips || [],
      nextActions: advice.nextActions || (advice.recommendations ? advice.recommendations.slice(0, 3) : []),
      dataUsed: {
        income: `Rs. ${income.toLocaleString()}`,
        savings: `Rs. ${(financialMetrics.savings || 0).toLocaleString()}`,
        loans: `${payload.loanCount || 0} active loans (EMI: Rs. ${(payload.totalEMI || 0).toLocaleString()})`,
        expenses: `Rs. ${(financialMetrics.expenses || 0).toLocaleString()} (estimated profile expenses)`
      },
      calculation: `Surplus = Income - Paid Expenses - EMI = Rs. ${income} - Rs. ${(payload.expenseStatus?.paidTotal || 0)} - Rs. ${(payload.totalEMI || 0)} = Rs. ${surplus}`,
      whyRecommendation: `Recommendations designed to optimize your debt recovery trajectory based on score of ${scoreVal}/100 (${displayCategory}).`,
      confidenceLevel: confidence
    };
  }
}

module.exports = MockProvider;
