// FlyWise - translations.js
// Central i18n dictionary. Every user-facing string lives here.

const TRANSLATIONS = {
  en: {
    dir: "ltr",
    meta: {
      title: "FlyWise: Fly Smarter. Travel Sustainably.",
      description: "FlyWise is a behavioral intelligence platform helping passengers make smarter, more sustainable travel decisions before, during and after their journey."
    },
    nav: {
      problem: "The Problem",
      how: "How It Works",
      why: "Why It Matters",
      survey: "Survey",
      cta: "Take the Survey"
    },
    hero: {
      eyebrow: "Behavioral Intelligence for Air Travel",
      title_line1: "Fly smarter.",
      title_line2: "Choose better.",
      title_line3: "Travel sustainably.",
      subtitle: "FlyWise studies how passengers decide what to pack, what to eat and how to travel, then turns those patterns into recommendations that cut waste and emissions. This page is part of an active research survey, not a product pitch.",
      cta_primary: "Take the Survey",
      cta_secondary: "Learn More",
      stat1_value: "5 min",
      stat1_label: "to complete",
      stat2_value: "100%",
      stat2_label: "anonymous",
      stat3_value: "15",
      stat3_label: "quick questions"
    },
    problem: {
      eyebrow: "The Problem",
      title: "Every trip starts with a hundred small guesses",
      subtitle: "Passengers decide what to pack, what to eat and how to move through an airport with almost no data, and those guesses add up to real environmental cost.",
      stat1_value: "23%",
      stat1_label: "of checked items",
      stat1_desc: "are never used during the trip",
      stat2_value: "1 in 3",
      stat2_label: "meals",
      stat2_desc: "pre-packed for travel go to waste",
      stat3_value: "+2-3%",
      stat3_label: "fuel burn",
      stat3_desc: "for every extra kilogram carried per passenger",
      stat4_value: "68%",
      stat4_label: "of travelers",
      stat4_desc: "say they don't know their trip's carbon footprint"
    },
    how: {
      eyebrow: "How FlyWise Works",
      title: "One decision at a time",
      subtitle: "FlyWise doesn't guess on your behalf. It learns from real passenger behavior and feeds better decisions back into the journey.",
      step1_title: "Understand behavior",
      step1_desc: "We study how passengers actually pack, plan and decide, not how they say they do.",
      step2_title: "Measure decisions",
      step2_desc: "Every choice, from luggage weight to meal selection, becomes a data point that reveals patterns.",
      step3_title: "Recommend better choices",
      step3_desc: "Patterns turn into lightweight, personal suggestions: pack less, choose differently, waste less.",
      step4_title: "Reward sustainable behavior",
      step4_desc: "Choices that reduce weight and waste are recognized and reinforced, not just noted.",
      step5_title: "Measure impact",
      step5_desc: "Aggregate behavior change is tracked back to fuel, food and carbon outcomes at fleet scale."
    },
    why: {
      eyebrow: "Why This Matters",
      title: "Small choices, aircraft-scale impact",
      subtitle: "Five everyday decisions quietly shape the environmental cost of every flight.",
      card1_title: "Food Waste",
      card1_desc: "Pre-packed meals that go untouched still cost fuel to carry and resources to produce.",
      card2_title: "Heavy Luggage",
      card2_desc: "Unused clothing and 'just in case' items add weight that burns fuel on every single flight.",
      card3_title: "Carbon Offset",
      card3_desc: "Most travelers have heard the term but don't know how offsetting actually works, or whether it's worth it.",
      card4_title: "Passenger Decisions",
      card4_desc: "Packing, meal choice and boarding behavior are made fast, alone, and almost always without data.",
      card5_title: "Behavioral Science",
      card5_desc: "Understanding why passengers decide the way they do is the first step to helping them decide better."
    },
    surveyIntro: {
      eyebrow: "About the Survey",
      title: "Behavioral Discovery Survey",
      intro: "We are running a short research survey to better understand passenger decision-making before, during and after flights. Your responses directly shape how FlyWise is built.",
      point1: "Fully anonymous, with no personal information collected",
      point2: "Takes about 5 minutes",
      point3: "Used strictly for research purposes",
      point4: "You can stop at any time, and progress is saved automatically",
      cta: "Start the Survey",
      preview_badge: "Sample question",
      disclaimer: "By continuing, you agree that your anonymous responses may be used for aviation sustainability research."
    },
    survey: {
      title: "Passenger Behavior Survey",
      step_of: "Step {current} of {total}",
      time_left: "~{time} min remaining",
      saved: "Progress saved",
      back: "Back",
      next: "Next",
      submit: "Submit Survey",
      required: "Please select an answer to continue",
      sections: {
        s1: "Travel Experience",
        s2: "Packing Habits",
        s3: "Sustainability Awareness",
        s4: "Behavior"
      },
      q1: {
        title: "How many times have you traveled by airplane?",
        options: ["First time", "2-5 times", "More than 5 times"]
      },
      q2: {
        title: "What is the purpose of your travel, most often?",
        options: ["Vacation", "Business", "Study", "Family", "Other"]
      },
      q3: {
        title: "How often do you pack clothes you never end up wearing?",
        options: ["Never", "Rarely", "Sometimes", "Often", "Always"]
      },
      q4: {
        title: "Have you ever packed food \u201Cjust in case\u201D and never used it?",
        options: ["Yes", "No"]
      },
      q5: {
        title: "How confident are you when packing for a trip?",
        scale_low: "Not confident",
        scale_high: "Very confident"
      },
      q6: {
        title: "Do you usually reach the airline's baggage weight limit?",
        options: ["Always", "Sometimes", "Never"]
      },
      q7: {
        title: "Did you know heavier baggage increases an aircraft's fuel consumption?",
        options: ["Yes", "No"]
      },
      q8: {
        title: "Have you heard of Carbon Offsetting before?",
        options: ["Yes", "No"]
      },
      q9: {
        title: "Would you participate in Carbon Offsetting if it were clearly explained to you?",
        options: ["Definitely", "Maybe", "No"]
      },
      q10: {
        title: "How interested are you in receiving rewards for sustainable travel choices?",
        scale_low: "Not interested",
        scale_high: "Very interested"
      },
      q11: {
        title: "Would personalized packing recommendations help you pack lighter?",
        options: ["Yes", "Maybe", "No"]
      },
      q12: {
        title: "Would you prefer selecting your own meal before a flight instead of packing meals for everyone?",
        options: ["Yes", "Maybe", "No"]
      },
      q13: {
        title: "Which sustainable action would you most likely take?",
        options: ["Use refill stations", "Sort waste properly", "Use a digital boarding pass", "Pack lighter luggage", "Participate in carbon offset"]
      },
      q14: {
        title: "What worries you most before traveling?",
        placeholder: "Share your thoughts…"
      },
      q15: {
        title: "Any additional comments?",
        placeholder: "Optional, anything else you'd like to share…"
      }
    },
    thanks: {
      title: "Your response has been recorded",
      subtitle: "Thank you for contributing to aviation sustainability research.",
      response_id: "Response ID",
      back_home: "Back to Home",
      note: "Your answers are stored anonymously and used only for this research survey."
    },
    footer: {
      tagline: "Behavioral intelligence for a lighter, smarter journey.",
      rights: "All rights reserved.",
      research: "This site is part of an active academic research initiative."
    }
  },

  ar: {
    dir: "rtl",
    meta: {
      title: "FlyWise: سافر بذكاء. سافر باستدامة.",
      description: "FlyWise منصة ذكاء سلوكي تساعد المسافرين على اتخاذ قرارات سفر أذكى وأكثر استدامة قبل رحلاتهم وأثناءها وبعدها."
    },
    nav: {
      problem: "المشكلة",
      how: "كيف تعمل FlyWise",
      why: "لماذا يهم هذا",
      survey: "الاستبيان",
      cta: "ابدأ الاستبيان"
    },
    hero: {
      eyebrow: "ذكاء سلوكي لعالم الطيران",
      title_line1: "سافر بذكاء.",
      title_line2: "اختر بشكل أفضل.",
      title_line3: "سافر باستدامة.",
      subtitle: "تدرس FlyWise كيف يقرر المسافرون ما يحزمونه وما يتناولونه وكيف يتنقلون داخل المطار، ثم تحوّل هذه الأنماط إلى توصيات تقلّل الهدر والانبعاثات. هذه الصفحة جزء من استبيان بحثي جارٍ، وليست عرضًا تسويقيًا.",
      cta_primary: "ابدأ الاستبيان",
      cta_secondary: "اعرف المزيد",
      stat1_value: "٥ دقائق",
      stat1_label: "لإكمال الاستبيان",
      stat2_value: "١٠٠٪",
      stat2_label: "مجهولة الهوية",
      stat3_value: "١٥",
      stat3_label: "سؤالًا سريعًا"
    },
    problem: {
      eyebrow: "المشكلة",
      title: "كل رحلة تبدأ بمئة تخمين صغير",
      subtitle: "يقرر المسافرون ما يحزمونه وما يأكلونه وكيف يتنقلون في المطار بأقل قدر من البيانات، وهذه التخمينات تتراكم لتشكل تكلفة بيئية حقيقية.",
      stat1_value: "٢٣٪",
      stat1_label: "من الأمتعة المسجّلة",
      stat1_desc: "لا تُستخدم أبدًا أثناء الرحلة",
      stat2_value: "١ من ٣",
      stat2_label: "وجبات",
      stat2_desc: "محضّرة مسبقًا للسفر تذهب هدرًا",
      stat3_value: "+٢-٣٪",
      stat3_label: "استهلاك وقود",
      stat3_desc: "مقابل كل كيلوغرام إضافي يُحمل لكل راكب",
      stat4_value: "٦٨٪",
      stat4_label: "من المسافرين",
      stat4_desc: "يقولون إنهم لا يعرفون بصمة رحلتهم الكربونية"
    },
    how: {
      eyebrow: "كيف تعمل FlyWise",
      title: "قرار واحد في كل مرة",
      subtitle: "لا تخمّن FlyWise نيابة عنك، بل تتعلّم من سلوك المسافرين الحقيقي وتعيد قرارات أفضل إلى رحلتهم.",
      step1_title: "فهم السلوك",
      step1_desc: "ندرس كيف يحزم المسافرون ويخططون ويقررون فعليًا، لا كما يقولون أنهم يفعلون.",
      step2_title: "قياس القرارات",
      step2_desc: "كل خيار، من وزن الأمتعة إلى اختيار الوجبة، يصبح نقطة بيانات تكشف عن أنماط.",
      step3_title: "توصية بخيارات أفضل",
      step3_desc: "تتحول الأنماط إلى اقتراحات شخصية وخفيفة: احزم أقل، اختر بشكل مختلف، قلّل الهدر.",
      step4_title: "مكافأة السلوك المستدام",
      step4_desc: "الخيارات التي تقلل الوزن والهدر يتم التعرف عليها وتعزيزها، لا مجرد تسجيلها.",
      step5_title: "قياس الأثر",
      step5_desc: "يُتتبّع التغيّر السلوكي الإجمالي وربطه بنتائج الوقود والغذاء والكربون على مستوى الأسطول."
    },
    why: {
      eyebrow: "لماذا يهم هذا",
      title: "قرارات صغيرة، أثر بحجم الطائرة",
      subtitle: "خمسة قرارات يومية تشكّل بهدوء التكلفة البيئية لكل رحلة.",
      card1_title: "هدر الطعام",
      card1_desc: "الوجبات المحضّرة مسبقًا وغير المستخدمة لا تزال تُكلّف وقودًا لحملها وموارد لإنتاجها.",
      card2_title: "الأمتعة الثقيلة",
      card2_desc: "الملابس غير المستخدمة وأغراض «الاحتياط» تضيف وزنًا يستهلك وقودًا في كل رحلة.",
      card3_title: "تعويض الكربون",
      card3_desc: "معظم المسافرين سمعوا بالمصطلح لكن لا يعرفون كيف يعمل التعويض فعليًا أو إن كان يستحق ذلك.",
      card4_title: "قرارات المسافر",
      card4_desc: "تُتخذ قرارات التعبئة واختيار الوجبة وسلوك الصعود بسرعة، بمفرده، وغالبًا دون بيانات.",
      card5_title: "العلوم السلوكية",
      card5_desc: "فهم سبب اتخاذ المسافرين لقراراتهم هو الخطوة الأولى لمساعدتهم على اتخاذ قرار أفضل."
    },
    surveyIntro: {
      eyebrow: "عن الاستبيان",
      title: "استبيان الاكتشاف السلوكي",
      intro: "نُجري استبيانًا بحثيًا لفهم أفضل لكيفية اتخاذ المسافرين لقراراتهم قبل الرحلات وأثناءها وبعدها. إجاباتك تُشكّل مباشرة كيفية بناء FlyWise.",
      point1: "مجهولة الهوية بالكامل، ولا تُجمع أي معلومات شخصية",
      point2: "تستغرق نحو ٥ دقائق",
      point3: "تُستخدم لأغراض البحث فقط",
      point4: "يمكنك التوقف في أي وقت، ويُحفظ تقدّمك تلقائيًا",
      cta: "ابدأ الاستبيان",
      preview_badge: "سؤال توضيحي",
      disclaimer: "بالمتابعة، أنت توافق على أن إجاباتك المجهولة قد تُستخدم في أبحاث استدامة الطيران."
    },
    survey: {
      title: "استبيان سلوك المسافر",
      step_of: "الخطوة {current} من {total}",
      time_left: "~{time} دقيقة متبقية",
      saved: "تم حفظ التقدم",
      back: "رجوع",
      next: "التالي",
      submit: "إرسال الاستبيان",
      required: "يُرجى اختيار إجابة للمتابعة",
      sections: {
        s1: "تجربة السفر",
        s2: "عادات التعبئة",
        s3: "الوعي بالاستدامة",
        s4: "السلوك"
      },
      q1: {
        title: "كم مرة سافرت بالطائرة؟",
        options: ["المرة الأولى", "٢-٥ مرات", "أكثر من ٥ مرات"]
      },
      q2: {
        title: "ما الغرض الأكثر شيوعًا لسفرك؟",
        options: ["إجازة", "عمل", "دراسة", "عائلة", "أخرى"]
      },
      q3: {
        title: "كم مرة تحزم ملابس لا ترتديها أبدًا؟",
        options: ["أبدًا", "نادرًا", "أحيانًا", "غالبًا", "دائمًا"]
      },
      q4: {
        title: "هل سبق أن حزمت طعامًا «احتياطيًا» ولم تستخدمه؟",
        options: ["نعم", "لا"]
      },
      q5: {
        title: "ما مدى ثقتك عند تعبئة أمتعتك للسفر؟",
        scale_low: "غير واثق",
        scale_high: "واثق جدًا"
      },
      q6: {
        title: "هل تصل عادةً إلى الحد الأقصى لوزن الأمتعة المسموح به؟",
        options: ["دائمًا", "أحيانًا", "أبدًا"]
      },
      q7: {
        title: "هل كنت تعلم أن الأمتعة الأثقل تزيد من استهلاك وقود الطائرة؟",
        options: ["نعم", "لا"]
      },
      q8: {
        title: "هل سمعت من قبل عن تعويض الكربون؟",
        options: ["نعم", "لا"]
      },
      q9: {
        title: "هل ستشارك في تعويض الكربون لو تم شرحه لك بوضوح؟",
        options: ["بالتأكيد", "ربما", "لا"]
      },
      q10: {
        title: "ما مدى اهتمامك بالحصول على مكافآت مقابل خيارات سفر مستدامة؟",
        scale_low: "غير مهتم",
        scale_high: "مهتم جدًا"
      },
      q11: {
        title: "هل ستساعدك توصيات تعبئة شخصية على تخفيف أمتعتك؟",
        options: ["نعم", "ربما", "لا"]
      },
      q12: {
        title: "هل تفضّل اختيار وجبتك بنفسك قبل الرحلة بدلًا من تحضير وجبات للجميع؟",
        options: ["نعم", "ربما", "لا"]
      },
      q13: {
        title: "أي إجراء مستدام تفعله على الأرجح؟",
        options: ["استخدام محطات إعادة التعبئة", "فرز النفايات", "استخدام بطاقة صعود رقمية", "تخفيف وزن الأمتعة", "المشاركة في تعويض الكربون"]
      },
      q14: {
        title: "ما الذي يقلقك أكثر قبل السفر؟",
        placeholder: "شاركنا أفكارك…"
      },
      q15: {
        title: "أي تعليقات إضافية؟",
        placeholder: "اختياري، أي شيء آخر تود مشاركته…"
      }
    },
    thanks: {
      title: "تم تسجيل إجابتك",
      subtitle: "شكرًا لمساهمتك في أبحاث استدامة الطيران.",
      response_id: "رقم الإجابة",
      back_home: "العودة للرئيسية",
      note: "تُحفظ إجاباتك بشكل مجهول وتُستخدم فقط لهذا الاستبيان البحثي."
    },
    footer: {
      tagline: "ذكاء سلوكي من أجل رحلة أخف وأذكى.",
      rights: "جميع الحقوق محفوظة.",
      research: "هذا الموقع جزء من مبادرة بحثية أكاديمية جارية."
    }
  }
};
