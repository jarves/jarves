System.config({
    baseURL: './bundles',
    transpiler: 'babel',
    traceurOptions: {
        annotations: true
    },
    babelOptions: {
        stage: 1
    }
});

// loads './app.js' from the current directory
System.import('jarves/JarvesApp.js').then(function(m) {
    console.log(m);
});