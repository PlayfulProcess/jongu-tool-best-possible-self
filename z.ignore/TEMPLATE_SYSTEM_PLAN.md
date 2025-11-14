# Journal Template System Enhancement Plan

## Overview
This document outlines the comprehensive plan for enhancing the journal template system with private templates, deep linking, entry filtering, and improved saved entry viewing.

**Core Principle: Keep It Simple!**
- Prioritize simplicity over fancy features
- Use built-in browser APIs and simple JavaScript
- No complex libraries or over-engineered solutions
- If a feature adds significant complexity for minimal value, skip it

---

## Phase 0: Quick Fixes

### 0.1 Update GitHub Link in Header

#### Actions for Fernando:
- [ ] Verify the new GitHub repository URL is correct
- [ ] Ensure repository is public or accessible

#### Actions for Claude:
- [ ] Update the GitHub link in the header from current link to: `https://github.com/PlayfulProcess/jongu-tool-best-possible-self`
- [ ] Update both desktop and mobile views if applicable
- [ ] Verify link opens in new tab

---

## Phase 1: Template Privacy & Storage Enhancements

### 1.1 Make User Templates Private by Default

#### Actions for Fernando:
- [ ] Confirm that `is_private` field exists in the database
- [ ] Test the privacy functionality after implementation
- [ ] Provide feedback on UI/UX for privacy indicators

#### Actions for Claude:
- [ ] ~~Add `is_private` boolean field~~ **Field already exists in database**
- [ ] Update RLS policies to respect privacy settings:
  ```sql
  -- Users can only see: their own templates + public templates + system templates
  CREATE POLICY "Users see own, public, and system templates"
    ON public.journal_templates
    FOR SELECT
    USING (
      user_id = auth.uid()
      OR is_private = false
      OR is_system = true
    );
  ```
- [ ] Update TemplateCreator component to include privacy toggle
- [ ] Update TemplateSelector to properly filter templates based on privacy

### 1.2 Store Template Information with Entries

#### Actions for Fernando:
- [ ] Confirm the template information we want to preserve (name, ui_prompt, description)
- [ ] Decide on fallback behavior if original template is deleted

#### Actions for Claude:
- [ ] Modify save functionality to store template snapshot in `document_data`:
  ```javascript
  document_data: {
    // existing fields...
    template_snapshot: {
      id: selectedTemplate?.uuid,
      name: selectedTemplate?.name,
      ui_prompt: selectedTemplate?.ui_prompt,
      description: selectedTemplate?.description
    }
  }
  ```
- [ ] Ensure both new entries and updates preserve template information

---

## Phase 2: Enhanced Entry Viewing

### 2.1 Display Template Info in Saved Entries

#### Actions for Fernando:
- [ ] Review the layout/design for showing template info with entries
- [ ] Provide feedback on what template details are most important to show

#### Actions for Claude:
- [ ] Add template information display when viewing saved entries
- [ ] Show: Template name, Journal prompt used, and description
- [ ] Create fallback UI if template_snapshot is missing (for old entries)
- [ ] Add visual hierarchy to distinguish template info from journal content

---

## Phase 3: Entry Filtering & Search

### 3.1 Date Filtering

#### Actions for Fernando:
- [ ] Specify preferred date filter options (Today, This Week, This Month, Custom Range)
- [ ] Decide on default date range to show

#### Actions for Claude:
- [ ] Add date filter dropdown/calendar in sidebar
- [ ] Implement date range filtering logic
- [ ] Add visual indicators for selected date range
- [ ] Store filter preferences in localStorage

### 3.2 Template/Prompt Filtering

#### Actions for Fernando:
- [x] ~~Confirm if filtering should be by template name~~ **Single-select dropdown**
- [x] ~~Decide if we need multi-select or single template filter~~ **Single-select confirmed**

#### Actions for Claude:
- [ ] Extract unique templates from user's entries
- [ ] Create simple single-select dropdown:
  - "All Templates" (default)
  - Individual template names
- [ ] Simple filter: `entries.filter(e => !selectedTemplate || e.template_id === selectedTemplate)`

### 3.3 Keyword Search (Keep It Simple!)

#### Actions for Fernando:
- [x] ~~Define search scope~~ **Search all visible text: journal content, AI chat messages, template name**
- [x] ~~Specify if search should be case-sensitive~~ **Case-insensitive for simplicity**
- [x] ~~Decide on highlighting search terms~~ **Skip highlighting to keep it simple**

#### Actions for Claude:
- [ ] Add basic search input field in sidebar
- [ ] Simple search implementation:
  ```javascript
  // Simple, readable search - no fancy libraries needed
  const searchLower = searchTerm.toLowerCase();
  const filtered = entries.filter(entry => {
    const content = entry.content.toLowerCase();
    const templateName = entry.template_name?.toLowerCase() || '';
    // Only search in what's already loaded, no extra API calls
    return content.includes(searchLower) ||
           templateName.includes(searchLower);
  });
  ```
- [ ] Simple debounce (300ms) to avoid lag
- [ ] Basic "No results" message

### 3.4 Combined Filtering UI (Simple & Clean)

#### Actions for Fernando:
- [ ] Review and approve the sidebar filter layout
- [ ] Test filter combinations for usability

#### Actions for Claude:
- [ ] Create simple, clean filter UI:
  ```
  [Search...                  ]

  [All Templates ▼]

  Showing 12 entries
  ─────────────────
  [Entry list...]
  ```
- [ ] Simple combination: all filters work together (AND)
- [ ] Skip "Clear filters" button - just clear the search box or select "All Templates"
- [ ] Skip filter indicators - the dropdowns/search show the current state

---

## Phase 4: Deep Linking System

### 4.1 Template-Specific URLs

#### Actions for Fernando:
- [ ] Approve URL structure (e.g., `/template/[uuid]` or `/?template=[uuid]`)
- [ ] Test deep linking functionality
- [ ] Create shareable links for your public templates

#### Actions for Claude:
- [ ] Add URL parameter support: `?template={uuid}`
- [ ] Auto-load and select template when parameter is present
- [ ] Handle cases where template doesn't exist or user lacks access
- [ ] Update browser URL when user manually selects a template

### 4.2 Public Template Sharing

#### Actions for Fernando:
- [ ] Decide which of your templates to make public
- [ ] Test sharing links with other users
- [ ] Provide feedback on sharing flow

#### Actions for Claude:
- [ ] Add "Copy shareable link" button for public templates
- [ ] Generate links like: `https://your-domain.com/?template=uuid-here`
- [ ] Show toast notification when link is copied
- [ ] Prevent sharing links for private templates

---

## Phase 5: Database Schema Updates

### Migration Script

#### Actions for Fernando:
- [ ] Review and approve the migration script
- [ ] Backup database before running migration
- [ ] Run migration in staging environment first

#### Actions for Claude:
- [ ] Create migration script for RLS policies update only:

```sql
-- Since is_private field already exists, we only need to:

-- 1. Update existing system templates to be public (if not already)
UPDATE public.journal_templates
SET is_private = false
WHERE is_system = true;

-- 2. Set default for user templates to be private
UPDATE public.journal_templates
SET is_private = true
WHERE is_system = false AND is_private IS NULL;

-- 3. Update RLS policies (see section 1.1)

-- 4. Add index for performance if not exists
CREATE INDEX IF NOT EXISTS idx_journal_templates_is_private
ON public.journal_templates(is_private);
```

---

## Implementation Priority Order

1. **Immediate: Quick Fixes**
   - Update GitHub link in header to new repository

2. **Week 1: Core Privacy & Storage**
   - Add is_private field and update RLS
   - Store template snapshot with entries
   - Update TemplateCreator with privacy toggle

3. **Week 2: Enhanced Viewing**
   - Display template info in saved entries
   - Implement deep linking system
   - Add shareable link generation

4. **Week 3: Filtering & Search**
   - Implement date filtering
   - Add template filtering
   - Implement keyword search
   - Create unified filter UI

---

## Testing Checklist

### For Fernando:
- [ ] Test creating private templates
- [ ] Test creating public templates
- [ ] Verify you can only see your own private templates
- [ ] Test deep linking to various templates
- [ ] Test all filter combinations
- [ ] Verify template info shows correctly in saved entries
- [ ] Test search functionality with various keywords

### For Claude:
- [ ] Write unit tests for filter functions
- [ ] Test RLS policies with multiple user accounts
- [ ] Verify template snapshot is preserved correctly
- [ ] Test edge cases (deleted templates, missing snapshots)
- [ ] Ensure backward compatibility with existing entries

---

## Future Enhancements (Not Priority)

- **Channels Integration**: Allow posting template links to channels.recursive.eco
- **Template Gallery**: Browse public templates from all users
- **Template Statistics**: Show usage count, average word count per template
- **Template Versioning**: Track changes to templates over time
- **Template Categories**: Organize templates by type (gratitude, goals, reflection, etc.)
- **Template Scheduling**: Set reminders to use specific templates

---

## Success Metrics

- Users can create and manage private templates
- Deep links work reliably for template sharing
- Entry filtering reduces time to find specific entries by 70%
- Template information is preserved even if original template is deleted
- Search functionality finds relevant entries within 1 second

---

## Notes

- Channel discovery integration is deprioritized for now
- All user-created templates default to private for privacy
- System templates remain public and cannot be made private
- Template snapshots ensure historical accuracy of entries