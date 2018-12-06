const express = require('express');
const router = express.Router();

// Destroy session and redirect back to homepage
router.get('/logout', function(req, res, next){
    req.session.destroy(function(err) {
        if (err)
            return next(err);
        res.redirect('/?logout=true');
    });
});

module.exports = router;