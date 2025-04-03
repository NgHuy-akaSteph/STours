/**
 * Usage: Catch async errors in express routes
 * @param {Function} fn 
 * @returns {Function}
 */
module.exports = fn => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    }
}
