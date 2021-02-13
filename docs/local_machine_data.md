## Data architecture
The main data repositories of Polymorph include:
- polymorph_core.userData: Device (browser) scope. 
```javascript
polymorph_core.userData={
    documents:{
        document_id:{
            saveSources:{
                saveSourceName:savesourceData
            },
            autosave: true/false
        }
    },
    tutorialData:{
        operatorName:operatorTutorialData
    }
}
```
