/**
 * CodeSense AI — Language capability registry route.
 *
 * Returns the public view of enabled review languages. Authoritative registry
 * lives on the backend; the client cannot enable languages by altering requests.
 */

const express = require('express');
const router = express.Router();
const { publicView } = require('../../config/languages');

router.get('/', (_req, res) => {
  res.json({ languages: publicView() });
});

module.exports = router;
