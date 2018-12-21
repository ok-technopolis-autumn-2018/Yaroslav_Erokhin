import jsonfile from 'jsonfile';

const babelrc = jsonfile.readFileSync('.babelrc');

// список презетов, которые принудительно будут убраны из babel-config, ибо нам нужны свои параметры для `env`
const blacklistedPresets = [
    'es2015',
    'es2016',
    'es2017',
    'es2018',
    'latest',
    'env',
];

export default DEV_MODE => {

    const presets = [
        // Latest *stable* ECMAScript features
        ['env', {
            modules: false,
            loose: true,
        }],
        ...babelrc.presets.filter(name => !blacklistedPresets.includes(name)),
    ];

    const plugins = [
        ...babelrc.plugins,
        ...!DEV_MODE ? [] : [
            // Adds component stack to warning messages
            // https://github.com/babel/babel/tree/master/packages/babel-plugin-transform-react-jsx-source
            'transform-react-jsx-source',
            // Adds __self attribute to JSX which React will use for some warnings
            // https://github.com/babel/babel/tree/master/packages/babel-plugin-transform-react-jsx-self
            'transform-react-jsx-self',
        ],
    ];


    return {
        // https://github.com/babel/babel-loader#options
        cacheDirectory: DEV_MODE,

        // https://babeljs.io/docs/usage/options/
        babelrc: false,
        presets,
        plugins,
    }
}
