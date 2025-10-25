# FlippersLog - Feature and Bug Fix Backlog

## Known Issues to Fix

### Critical (Blocking Production Use)
- [ ] confirm detection works properly

### High Priority
- [x] Handle unknown table name 

### Medium Priority
- [x] get rid of the 'delete' button since we have swipe-to-delete
- [ ] EM wheel-style score edit
- [x] quick select on table name at detection confirm screen
- [x] edit score shows Table Unknown. 
- [x] must be keeping the photo, when i edit a photo import, it recalls the image. table name works
- [x] but a manually entered table has table unknown when i edit.  
- [x] quick select seems to have infinite stacking, need only a couple of lines. 
- [ ] ordering of a large number of tables? 
- [ ] dont need "required fields" or the star after Table Name or Score
- [ ] bug: i have Medieval Madness in my quick select. I want to enter Monster Mash, which is not there. I type, M, it shows Medieval madness only, I type O, and it adds to the autocompleted word. 
- [ ] No scores yet page still has game controller icon. 


### Low Priority / Nice to Have
- [ ] investigate the "card" stacking part of the UI
- [x] get the background to load
- [ ] logos, backgrounds, visual flair
- [ ] motion, sparkle, confetti
- [ ] Improve table detection
- [ ] icon at top of page for entry score update
- [ ] remove useless manufacturer entry field on enter score
- [ ] auto pick an emojii for each table

## Planned Features
- [ ] graph of scores over time
- [ ] back end for proper API usage
- [ ] location detection
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

