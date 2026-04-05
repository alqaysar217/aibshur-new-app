# **App Name**: أبشر

## Core Features:

- Splash Screen Presentation: Display a splash screen with the app logo (rounded corners, smooth zoom animation), app name 'أبشر', and a minimal loader for 2-3 seconds before navigating.
- Governorate Selection Interface: Provide a screen to select a Yemeni governorate, including a title 'اختر محافظتك', a search input for filtering, and a clickable list of governorates. Selection is saved to local state only.
- Authentication UI Flows: Implement Login and Register screens featuring an SVG/illustration, appropriate titles ('تسجيل الدخول'), phone number input with a Yemen flag icon, and navigation to OTP or Register screens.
- OTP Verification Input: Present a centered layout with 4-6 input boxes for OTP verification (mock OTP: 123456) and handle navigation upon submission.
- Home Screen Navigation & Layout: Set up the Home screen with a top bar containing the app logo + 'أبشر', search, notifications, and cart icons. Include a bottom navigation bar with 'الرئيسية', 'البحث', 'طلباتي', 'المفضلة', and 'حسابي' options.
- Home Content Display: Showcase a variety of content sections: horizontally scrollable store categories with square icons and text (e.g., مطاعم, صيدليات), a full-width ads banner slider, store filters (pills for 'الكل', 'الأقرب', 'المفضلة', 'الأعلى تقييم'), and a grid of store cards displaying image, name, address, distance, category, rating, status (مفتوح/مغلق), and a favorite icon. Store clicks navigate to an empty placeholder.
- RTL and Mobile-First Adaptation: Ensure the entire user interface strictly adheres to Right-to-Left (RTL) layout, is optimized for mobile screens, maintains clean spacing, utilizes small readable fonts, and incorporates soft shadows for a modern, professional aesthetic.

## Style Guidelines:

- The application will utilize a light color scheme to promote readability and a clean aesthetic. The primary color, '#28A5BD' (a medium blue-green), evokes freshness and reliability, suited for a delivery service. The background color, '#F0F4F5' (a very light, desaturated blue-green), offers a subtle variation of the primary hue, ensuring harmony. An accent color of '#71A112' (a darker, earthy green) provides a clear contrast for interactive elements and calls to action, suggesting vitality and natural quality.
- The font for both headlines and body text will be 'Inter', a modern sans-serif that ensures clarity and excellent readability across various mobile screen sizes and maintains a professional, objective feel, consistent with contemporary app design principles.
- Icons will feature a clean, minimalist line-art style with consistent weight, complementing the modern UI. Category icons will be square with 10px rounded corners, emphasizing clear visual separation. Specific icons for search, notifications, cart, favorite, home, orders, and account will be consistently applied throughout the app's navigation.
- All screen elements will be designed with a Right-to-Left (RTL) orientation and optimized for mobile devices, prioritizing intuitive navigation and interaction. Emphasis will be placed on clean spacing between elements and responsive design to ensure optimal viewing and functionality on diverse mobile platforms.
- Key animations include a smooth zoom effect for the logo on the splash screen and a subtle, minimal loader to enhance user experience during initial loading. General screen transitions will be smooth and unobtrusive, contributing to a fluid and engaging user interface.