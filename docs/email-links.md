# Email links and codes

Apply server/email-links.sql after accounts.sql before enabling accounts. Each email contains a random 256-bit link token and six-digit code. Only the token hash is stored. Both expire after ten minutes and share one used_at marker. A GET or email preview cannot consume either; the app requires an explicit Continue POST with same-origin validation. The fragment is cleared before rendering or loading Google.

The link signs in the browser where it is opened. It does not restore anonymous plans from another browser; plan recovery is separate. No live provider sends were tested.
