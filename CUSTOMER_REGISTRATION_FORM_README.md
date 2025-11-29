# Dynamic Customer Registration Form - DR7 Empire

A modern, responsive customer registration form that automatically adapts based on the selected client type (Tipo cliente).

## Features

✅ **3 Client Types:**
- Azienda (Company)
- Persona Fisica (Individual)
- Pubblica Amministrazione (Public Administration)

✅ **Dynamic Form Fields** - Shows/hides fields based on selection
✅ **Search/Lookup Buttons** - Integrated search functionality for key fields
✅ **Responsive Design** - Works perfectly on desktop, tablet, and mobile
✅ **Modern UI** - Gold and black DR7 Empire theme
✅ **Smooth Animations** - Professional fade-in effects
✅ **Italian Language** - All labels and text in Italian

## Two Implementations

### 1. React/TypeScript Component
**File:** `components/DynamicCustomerForm.tsx`

**Use in React:**
```tsx
import DynamicCustomerForm from './components/DynamicCustomerForm'

function App() {
  const handleSubmit = (data) => {
    console.log('Customer data:', data)
    // Send to your API
  }

  return (
    <DynamicCustomerForm
      onSubmit={handleSubmit}
      isAdminMode={false}  // Set to true for admin panel
    />
  )
}
```

**Props:**
- `onSubmit: (data: CustomerFormData) => void` - Callback when form is submitted
- `isAdminMode?: boolean` - Optional, changes styling for admin panel (default: false)

### 2. Standalone HTML/CSS/JS
**File:** `public/customer-registration-form.html`

**Access directly:**
```
https://your-domain.com/customer-registration-form.html
```

**Embed in existing page:**
```html
<iframe
  src="/customer-registration-form.html"
  width="100%"
  height="1000px"
  frameborder="0"
></iframe>
```

## Form Configurations

### AZIENDA (Company)

**Required Fields:**
- Nazione (default: Italia)
- Denominazione + 🔍 Cerca per denominazione
- Partita IVA + 🔍 Cerca per Partita IVA
- Codice Fiscale
- Indirizzo

**Optional Fields:**
- (Empty section for future additions)

---

### PERSONA FISICA (Individual)

**Required Fields:**
- Nazione (default: Italia)
- Nome
- Cognome
- Codice Fiscale
- Indirizzo

**Optional Fields:**
- Telefono
- Email
- PEC

---

### PUBBLICA AMMINISTRAZIONE (Public Administration)

**Required Fields:**
- Codice Univoco + 🔍 Cerca per codice univoco
- Codice Fiscale + 🔍 Cerca per Codice Fiscale
- Ente o Ufficio + 🔍 Cerca per Ente o ufficio
- Città + 🔍 Cerca per città

---

## Implementing Search Functions

The search buttons are placeholders that need to be connected to your backend API.

### Example Implementation (React):

```typescript
const cercaPerPartitaIVA = async () => {
  try {
    const response = await fetch(`/api/search/partita-iva?q=${formData.partitaIVA}`)
    const data = await response.json()

    // Auto-fill form with results
    setFormData(prev => ({
      ...prev,
      denominazione: data.denominazione,
      codiceFiscale: data.codiceFiscale,
      indirizzo: data.indirizzo
    }))
  } catch (error) {
    console.error('Search failed:', error)
  }
}
```

### Example Implementation (Standalone HTML):

Replace the placeholder functions in the `<script>` section:

```javascript
async function cercaPerPartitaIVA() {
  const partitaIVA = document.getElementById('partitaIVA').value;

  try {
    const response = await fetch(`/api/search/partita-iva?q=${partitaIVA}`);
    const data = await response.json();

    // Auto-fill fields
    document.getElementById('denominazione').value = data.denominazione;
    document.getElementById('codiceFiscale_az').value = data.codiceFiscale;
    document.getElementById('indirizzo_az').value = data.indirizzo;
  } catch (error) {
    console.error('Search failed:', error);
    alert('Errore durante la ricerca');
  }
}
```

## Customization

### Colors

The form uses the DR7 Empire gold and black theme. To customize colors, modify these CSS variables:

```css
/* Primary gold color */
#f4c430

/* Dark background */
#1a1a1a, #2d2d2d

/* Text colors */
#fff (white)
#9ca3af (gray)
```

### Styling

All styles are contained within each file:
- **React Component:** Inline `<style>` tag at line 64
- **HTML Version:** `<style>` tag in `<head>` section

### Animations

Animation timing can be adjusted:

```css
@keyframes fadeIn {
  /* Adjust duration here (currently 0.3s or 0.4s) */
}
```

## Form Validation

### Required Fields

Fields marked with red asterisk (*) are required. The form will not submit until all required fields for the selected client type are filled.

### Input Types

- `type="text"` - Standard text inputs
- `type="tel"` - Telephone (shows numeric keyboard on mobile)
- `type="email"` - Email validation
- `type="email"` - PEC validation (same as email)

### Custom Validation

Add custom validation in the submit handler:

```javascript
customerForm.addEventListener('submit', function(e) {
  e.preventDefault();

  // Custom validation
  const partitaIVA = document.getElementById('partitaIVA').value;
  if (!/^IT\d{11}$/.test(partitaIVA)) {
    alert('Partita IVA non valida');
    return;
  }

  // Continue with submission
})
```

## Backend Integration

### Expected API Endpoints

For full functionality, implement these endpoints:

1. **POST `/api/register-customer`** - Create customer
2. **GET `/api/search/denominazione?q={query}`** - Search company by name
3. **GET `/api/search/partita-iva?q={query}`** - Search by VAT number
4. **GET `/api/search/codice-univoco?q={query}`** - Search by unique code
5. **GET `/api/search/codice-fiscale?q={query}`** - Search by fiscal code
6. **GET `/api/search/ente-ufficio?q={query}`** - Search by office/entity
7. **GET `/api/search/citta?q={query}`** - Search by city

### Example Backend Response

```json
{
  "success": true,
  "data": {
    "denominazione": "DR7 Empire SRL",
    "partitaIVA": "IT12345678901",
    "codiceFiscale": "12345678901",
    "indirizzo": "Via Roma 123, 09100 Cagliari"
  }
}
```

## Admin Panel Integration

### In React Admin Panel

```tsx
import DynamicCustomerForm from '../components/DynamicCustomerForm'

function AdminCustomerCreate() {
  const handleSubmit = async (data) => {
    // Send to admin API
    await fetch('/api/admin/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
  }

  return (
    <DynamicCustomerForm
      onSubmit={handleSubmit}
      isAdminMode={true}  // Admin styling
    />
  )
}
```

### Styling Differences

When `isAdminMode={true}`:
- Darker background gradient
- "Crea Nuovo Cliente" title instead of "Registrazione Cliente"
- "Crea Cliente" button instead of "Registrati"

## Mobile Responsiveness

The form automatically adapts to mobile screens:

- **Desktop:** Search buttons appear next to inputs
- **Mobile:** Search buttons stack below inputs (full width)
- **Touch-friendly:** Large tap targets (minimum 44px)
- **iOS Safe:** Font size 16px prevents zoom on focus

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Android)

## Accessibility

- ✅ Semantic HTML
- ✅ Proper label associations
- ✅ Keyboard navigation
- ✅ Focus indicators
- ✅ Required field markers
- ✅ ARIA labels (can be enhanced)

## Testing

### Test Scenarios

1. Select each client type and verify correct fields appear
2. Test all search buttons
3. Submit form with valid data
4. Submit form with missing required fields
5. Test on mobile device
6. Test in admin mode

### Sample Test Data

**Azienda:**
```
Denominazione: DR7 Empire SRL
Partita IVA: IT12345678901
Codice Fiscale: 12345678901
Indirizzo: Via Roma 123, 09100 Cagliari
```

**Persona Fisica:**
```
Nome: Mario
Cognome: Rossi
Codice Fiscale: RSSMRA80A01H501U
Indirizzo: Via Garibaldi 45, 09100 Cagliari
Telefono: +39 123 456 7890
Email: mario.rossi@example.it
```

**Pubblica Amministrazione:**
```
Codice Univoco: UFY9MH
Codice Fiscale: 80016350923
Ente o Ufficio: Comune di Cagliari
Città: Cagliari
```

## Troubleshooting

### Form fields not showing
- Check JavaScript console for errors
- Verify `tipoCliente` select has a value
- Ensure CSS classes are applied correctly

### Search buttons not working
- Implement the search functions (they are placeholders)
- Check network tab for API call failures
- Verify CORS settings if API is on different domain

### Styling issues
- Clear browser cache
- Check for CSS conflicts with existing styles
- Verify all CSS is loaded

## Future Enhancements

Possible additions:
- Address autocomplete (Google Maps API)
- Real-time validation
- Progress indicator
- File upload for documents
- Multi-step wizard
- Save draft functionality

## Support

For issues or questions:
- Check this README first
- Review console logs
- Test with sample data above

## License

Proprietary - DR7 Empire
