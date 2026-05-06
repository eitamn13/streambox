# StreamBox

הדור הבא של סטרימינג - פלטפורמת סטרימינג פרימיום עם עיצוב עתידני, AI חכם, ספורט חי וטלוויזיה.

## תכונות עיקריות

- **עיצוב עתידני פרימיום** - Glass morphism, neon glows, אנימציות חלקות
- **AI חכם** - עוזר אישי שמבין עברית, ממליץ תוכן, ועונה על שאלות
- **ספורט חי** - תוצאות בזמן אמת, ליגות, היילייטס
- **טלוויזיה חיה** - ערוצי עידן פלוס, חדשות, ספורט ובידור
- **שחקן מרשים** - פקדים מינימליים, בורר איכות, כתוביות
- **מובנה מלא** - ניווט תחתון, כרטיסי מגע, אנימציות 60fps

## טכנולוגיות

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Zustand (state management)
- React Query
- TMDB API

## הרצה

```bash
npm install --legacy-peer-deps
npm run dev
```

## בנייה

```bash
npm run build
```

## גישה

- **אפליקציה**: http://localhost:3000/
- **דף נחיתה**: http://localhost:3000/landing/

## התחברות

- **Google Sign-In** - לחץ על "התחבר עם Google"
- **מספר טלפון** - הזן מספר וקוד OTP
- **אימייל** - admin@streambox.local / Admin123 (מנהל)

## מבנה פרויקט

```
src/
  components/     - רכיבים משותפים
  pages/          - דפים ראשיים
  hooks/          - hooks מותאמים אישית
  store/          - ניהול state (Zustand)
  utils/          - פונקציות עזר
  data/           - mock data
  types/          - TypeScript types
landing/          - דף נחיתה נפרד
```
