---
description: How to find the app UI parameter for deep linking
---

# Getting the App UI Parameter for Canva Deep Links

The `ui` parameter is required when creating deep links to open templates in the Canva editor. Here's how to find it:

## Steps

1. **Open the Canva Developer Portal**
   - Go to https://www.canva.com/developers/
   - Sign in with your Canva account

2. **Navigate to Your App**
   - Click on your "Printssistant" app in the developer portal

3. **Preview Your App**
   - Click the "Preview" or "Open in Canva" button to launch your app in the Canva editor

4. **Inspect the URL**
   - Look at the URL in your browser's address bar
   - It will look something like: `https://www.canva.com/design/XXXXX/edit?ui=eyJhcHBJZCI6...`
   - Copy the entire value after `ui=`

5. **Update the Code**
   - Open `printssistant/src/hooks/useTemplateOperations.ts`
   - Find line 36: `const appUi = 'YOUR_APP_UI_VALUE';`
   - Replace `'YOUR_APP_UI_VALUE'` with the actual `ui` parameter value you copied
   - For example: `const appUi = 'eyJhcHBJZCI6IjEyMzQ1Njc4OTAifQ';`

## Example

If your preview URL is:

```
https://www.canva.com/design/DAF123ABC/edit?ui=eyJhcHBJZCI6IjEyMzQ1Njc4OTAifQ
```

Then update the code to:

```typescript
const appUi = "eyJhcHBJZCI6IjEyMzQ1Njc4OTAifQ";
```

## Note

The `ui` parameter is a Base64-encoded JSON object containing your app ID and potentially other metadata. It's unique to your app and tells Canva which app context to use when opening the design.
