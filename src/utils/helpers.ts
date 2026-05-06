import type { TimeOfDay } from '../types'

export function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 21) return 'evening'
  return 'night'
}

export function getGreeting(name: string = 'איתן'): string {
  const timeOfDay = getTimeOfDay()
  const greetings = {
    morning: `בוקר טוב, ${name} ☀️`,
    afternoon: `צהריים טובים, ${name} 🌤️`,
    evening: `ערב טוב, ${name} 🌙`,
    night: `לילה טוב, ${name} ✨`,
  }
  return greetings[timeOfDay]
}

export function getBackgroundGradient(): string {
  const timeOfDay = getTimeOfDay()
  const gradients = {
    morning: 'linear-gradient(135deg, #0a0e27 0%, #1a2342 50%, #0f172a 100%)',
    afternoon: 'linear-gradient(135deg, #0a0e27 0%, #1e1b4b 50%, #0a0e27 100%)',
    evening: 'linear-gradient(135deg, #0a0e27 0%, #2d1b4e 50%, #0a0e27 100%)',
    night: 'linear-gradient(135deg, #020617 0%, #0a0e27 50%, #1e1b4b 100%)',
  }
  return gradients[timeOfDay]
}

export function formatRuntime(minutes: number): string {
  if (!minutes) return ''
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins} דקות`
  if (mins === 0) return `${hours} שעות`
  return `${hours} שעות ו-${mins} דקות`
}

export function getYear(dateString: string): string {
  if (!dateString) return ''
  return new Date(dateString).getFullYear().toString()
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function generateAIResponse(query: string): { text: string; suggestions?: string[] } {
  const lowerQuery = query.toLowerCase()
  
  if (lowerQuery.includes('מטורף') || lowerQuery.includes('אקשן') || lowerQuery.includes('מותח')) {
    return {
      text: 'מצאתי כמה סרטי אקשן מטורפים בשבילך! 🔥 "ניאון דרימס" הוא בחירה מעולה עם ציון 9.1, וגם "האיש שהיה שם" עם ציון 8.3. שניהם חדשים ומקבלים הדים מעולים.',
      suggestions: ['עוד המלצות אקשן', 'מה עם מתח?', 'סרטים חדשים']
    }
  }
  
  if (lowerQuery.includes('ממכר') || lowerQuery.includes('סדרה') || lowerQuery.includes('בינג')) {
    return {
      text: 'יש לי כמה סדרות ממכרות בשבילך! 📺 "תל אביב 3000" הוא להיט ישראלי חדש עם ציון 8.4, ו-"רחובות לונדון" היא דרמה בריטית מעולה. שניהם מושלמים למרתון!',
      suggestions: ['סדרות קומדיה', 'סדרות מתח', 'סדרות מומלצות נוספות']
    }
  }
  
  if (lowerQuery.includes('חם') || lowerQuery.includes('טרנדי') || lowerQuery.includes('פופולרי')) {
    return {
      text: 'מה שחם עכשיו 🔥 "דונה: ריקוד המוות" מוביל את הטרנדים עם ציון 8.7, ו-"ניאון דרימס" צובר תאוצה עם 9.1. שניהם נמצאים ברשימת החמים של StreamBox.',
      suggestions: ['סרטים חדשים', 'סדרות חמות', 'המלצות אישיות']
    }
  }
  
  if (lowerQuery.includes('כדורגל') || lowerQuery.includes('ספורט') || lowerQuery.includes('nba')) {
    return {
      text: '⚽ ברצלונה vs ריאל מדריד משחקים עכשיו בדקה 67! תוצאה 2:1. גם מכבי תל אביב מול באר שבע בשידור חי. רוצה לעבור למרכז הספורט?',
      suggestions: ['למרכז הספורט', 'תוצאות חיות', 'ליגת האלופות']
    }
  }
  
  if (lowerQuery.includes('לילה') || lowerQuery.includes('ערב') || lowerQuery.includes('לפני שינה')) {
    return {
      text: 'ללילה מושלם 🌙 ממליץ על "לב הים" - דרמה מרגשת ורגועה עם ציון 8.9, או "קולנוע כוכבים" שהוא קלאסיקה מודרנית. שניהם מושלמים לערב רגוע.',
      suggestions: ['סרטים קלילים', 'קומדיות', 'דוקומנטריות']
    }
  }
  
  return {
    text: `מעניין ששאלת "${query}" 🤔 יש לי המון המלצות בשבילך! מה דעתך על "ניאון דרימס" - סרט מדע בדיוני מעולה עם ציון 9.1? או אולי "תל אביב 3000" - סדרה ישראלית חדשה ומדהימה?`,
    suggestions: ['סרטים מומלצים', 'סדרות חדשות', 'מה חם עכשיו']
  }
}
