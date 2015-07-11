System.config({
    baseURL: './bundles',
    transpiler: 'traceur',
    traceurOptions: {
        annotations: true
    }
});

// loads './app.js' from the current directory
System.import('jarves/JarvesApp.js').then(function(m) {
    console.log(m);
});