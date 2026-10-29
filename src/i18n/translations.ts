export type AppLanguage = 'en' | 'si' | 'ta';

export interface LanguageOption {
  code: AppLanguage;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
];

export const translations = {
  en: {
    // Header
    yourAccount: 'Your account 🌿',
    my: 'My',
    profile: 'Profile',
    edit: 'Edit',

    // Hero Profile Card
    verifiedSupplier: 'Verified Supplier',
    buyBackPartner: 'Buy-back partner',
    products: 'Products',
    farmers: 'Farmers',
    rating: 'Rating',

    // Trust Score Card
    trustScore: 'Trust score',
    highlyTrusted: 'Highly trusted',
    trustSubtitle: '98% of requests fulfilled within 48 hours',

    // Tabs
    tabAbout: 'About',
    tabProducts: 'Products',
    tabReviews: 'Reviews',
    tabDocuments: 'Documents',

    // Contact Details
    phone: 'Phone',
    email: 'Email',
    store: 'Store',
    licence: 'Licence',

    // Location Card
    location: 'Location',
    centralProvince: 'Central Province, Sri Lanka',

    // Settings
    settings: 'Settings',
    darkMode: 'Dark mode',
    on: 'On',
    off: 'Off',
    notifications: 'Notifications',
    notificationsSubtitle: 'Orders, contracts & alerts',
    language: 'Language',
    selectLanguage: 'Select Language',
    chooseLanguageSubtitle: 'Choose your preferred display language',

    // Actions & Modal
    logOut: 'Log out',
    logOutConfirmTitle: 'Log Out',
    logOutConfirmMessage: 'Are you sure you want to log out of your supplier account?',
    cancel: 'Cancel',
    editSupplierProfile: 'Edit Supplier Profile',
    companyName: 'Company Name',
    phoneNumber: 'Phone Number',
    emailAddress: 'Email Address',
    storeLocation: 'Store Location',
    aboutDescription: 'About & Description',
    saveChanges: 'Save Changes',
  },

  si: {
    // Header
    yourAccount: 'ඔබගේ ගිණුම 🌿',
    my: 'මගේ',
    profile: 'පැතිකඩ',
    edit: 'සංස්කරණය',

    // Hero Profile Card
    verifiedSupplier: 'සහතිකලත් සැපයුම්කරු',
    buyBackPartner: 'ආපසු මිලදී ගැනීමේ සහකරු',
    products: 'නිෂ්පාදන',
    farmers: 'ගොවීන්',
    rating: 'ඇගයීම',

    // Trust Score Card
    trustScore: 'විශ්වාසනීයත්ව ලකුණු',
    highlyTrusted: 'ඉහළ විශ්වාසනීයත්වය',
    trustSubtitle: 'පැය 48ක් තුළ 98%ක් ඉල්ලීම් සම්පූර්ණ කර ඇත',

    // Tabs
    tabAbout: 'විස්තරය',
    tabProducts: 'නිෂ්පාදන',
    tabReviews: 'සමාලෝචන',
    tabDocuments: 'ලේඛන',

    // Contact Details
    phone: 'දුරකථන අංකය',
    email: 'විද්‍යුත් තැපෑල',
    store: 'වෙළඳසැල',
    licence: 'බලපත්‍රය',

    // Location Card
    location: 'ස්ථානය',
    centralProvince: 'මධ්‍යම පළාත, ශ්‍රී ලංකාව',

    // Settings
    settings: 'සැකසුම්',
    darkMode: 'අඳුරු ප්‍රකාරය',
    on: 'ක්‍රියාත්මකයි',
    off: 'අක්‍රියයි',
    notifications: 'දැනුම්දීම්',
    notificationsSubtitle: 'ඇණවුම්, ගිවිසුම් සහ දැනුම්දීම්',
    language: 'භාෂාව',
    selectLanguage: 'භාෂාව තෝරන්න',
    chooseLanguageSubtitle: 'ඔබ කැමති ප්‍රදර්ශන භාෂාව තෝරාගන්න',

    // Actions & Modal
    logOut: 'පිටවීම',
    logOutConfirmTitle: 'ගිණුමෙන් පිටවීම',
    logOutConfirmMessage: 'ඔබගේ සැපයුම්කරු ගිණුමෙන් පිටවීමට ඔබට සහතිකද?',
    cancel: 'අවලංගු කරන්න',
    editSupplierProfile: 'සැපයුම්කරු පැතිකඩ සංස්කරණය',
    companyName: 'සමාගමේ නම',
    phoneNumber: 'දුරකථන අංකය',
    emailAddress: 'විද්‍යුත් තැපැල් ලිපිනය',
    storeLocation: 'වෙළඳසැල් ස්ථානය',
    aboutDescription: 'විස්තරය',
    saveChanges: 'වෙනස්කම් සුරකින්න',
  },

  ta: {
    // Header
    yourAccount: 'உங்கள் கணக்கு 🌿',
    my: 'எனது',
    profile: 'சுயவிவரம்',
    edit: 'திருத்து',

    // Hero Profile Card
    verifiedSupplier: 'சரிபார்க்கப்பட்ட சப்ளையர்',
    buyBackPartner: 'திரும்ப வாங்கும் கூட்டாளர்',
    products: 'தயாரிப்புகள்',
    farmers: 'விவசாயிகள்',
    rating: 'மதிப்பீடு',

    // Trust Score Card
    trustScore: 'நம்பகத்தன்மை மதிப்பெண்',
    highlyTrusted: 'மிகவும் நம்பகமானது',
    trustSubtitle: '48 மணி நேரத்திற்குள் 98% கோரிக்கைகள் நிறைவேற்றப்பட்டன',

    // Tabs
    tabAbout: 'பற்றி',
    tabProducts: 'தயாரிப்புகள்',
    tabReviews: 'மதிப்புரைகள்',
    tabDocuments: 'ஆவணங்கள்',

    // Contact Details
    phone: 'தொலைபேசி',
    email: 'மின்னஞ்சல்',
    store: 'கடை',
    licence: 'உரிமம்',

    // Location Card
    location: 'இருப்பிடம்',
    centralProvince: 'மத்திய மாகாணம், இலங்கை',

    // Settings
    settings: 'அமைப்புகள்',
    darkMode: 'டார்க் மோட்',
    on: 'செயலில்',
    off: 'முடக்கம்',
    notifications: 'அறிவிப்புகள்',
    notificationsSubtitle: 'ஆர்டர்கள், ஒப்பந்தங்கள் & விழிப்பூட்டல்கள்',
    language: 'மொழி',
    selectLanguage: 'மொழியைத் தேர்ந்தெடுக்கவும்',
    chooseLanguageSubtitle: 'உங்கள் விருப்பமான காட்சி மொழியைத் தேர்வுசெய்யவும்',

    // Actions & Modal
    logOut: 'வெளியேறு',
    logOutConfirmTitle: 'வெளியேறுதல்',
    logOutConfirmMessage: 'உங்கள் சப்ளையர் கணக்கிலிருந்து வெளியேற விரும்புகிறீர்களா?',
    cancel: 'ரத்து செய்',
    editSupplierProfile: 'சப்ளையர் சுயவிவரத்தைத் திருத்தவும்',
    companyName: 'நிறுவனத்தின் பெயர்',
    phoneNumber: 'தொலைபேசி எண்',
    emailAddress: 'மின்னஞ்சல் முகவரி',
    storeLocation: 'கடை அமைவிடம்',
    aboutDescription: 'விவரம்',
    saveChanges: 'மாற்றங்களைச் சேமிக்கவும்',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;
