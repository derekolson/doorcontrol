module.exports = function(){
    switch(process.env.NODE_ENV){
        case 'development':
            return {};

        case 'production':
            return {};

        default:
            return {};
    }
};