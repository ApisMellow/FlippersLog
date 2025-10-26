# FlippersLog - Feature and Bug Fix Backlog

## Known Issues to Fix

### Critical (Blocking Production Use)
- [ ] confirm detection works properly

### High Priority
- [x] Handle unknown table name 
- [ ] Android compatibility

### Medium Priority
- [x] get rid of the 'delete' button since we have swipe-to-delete
- [ ] EM wheel-style score edit
- [x] quick select on table name at detection confirm screen
- [x] edit score shows Table Unknown. 
- [x] must be keeping the photo, when i edit a photo import, it recalls the image. table name works
- [x] but a manually entered table has table unknown when i edit.  
- [x] quick select seems to have infinite stacking, need only a couple of lines. 
- [x] ordering of a large number of tables? 
- [x] dont need "required fields" or the star after Table Name or Score
- [x] bug: i have Medieval Madness in my quick select. I want to enter Monster Mash, which is not there. I type, M, it shows Medieval madness only, I type O, and it adds to the autocompleted word. 
- [x] No scores yet page still has game controller icon. 
- [ ] remove Ionicons dependency (trash, pencil, create, camera)
- [ ] score entry number pad obscures the Save Scores button (camera mode needs a slightly more buffer)
- [x] replace the pencil paper icon on front page with a plus button, if this is from ionicons dont use ionicons for the replacement. 
- [x] shows an echo of the score below the field, no idea why
- [ ] fix expo doctor alerts, npx expo install --fix

### Low Priority / Nice to Have
- [ ] investigate the "card" stacking part of the UI
- [x] get the background to load
- [ ] logos, backgrounds, visual flair
- [ ] motion, sparkle, confetti
- [ ] Improve table detection
- [x] icon at top of page for entry score update
- [x] remove useless manufacturer entry field on enter score
- [ ] auto pick an emojii for each table
- update readme project structure, dependencies, MVP features or remove that section

## Planned Features
- [ ] pinball map API to pick out a location, chose a site, see all your scores there
- [ ] a server back end for proper API usage
- [ ] location detection and table suggestion?
- [ ] built in starting list of all known tables
- [ ] API access to external pinball authoritative sites

### Phase 1
- [ ]

### Phase 2
- [ ]

## Testing Notes
- All 62 unit tests passing as of commit 13b1113
- Next: Create TestFlight build and verify detection works end-to-end

## Build History

---

