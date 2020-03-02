const fetch = require('node-fetch')
const querystring = require('querystring')
const { URLSearchParams } = require('url')

/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */
module.exports = app => {
  // Your code here
  app.log('Yay, the app was loaded!')

  app.on('issues.opened', async context => {
    const issueComment = context.issue({ body: 'Thanks for opening this issue!' })
    return context.github.issues.createComment(issueComment)
  })

  app.on('installation.created', async context => {
    return context.repos.createForAuthenticatedUser({ name: 'cardstack-builder-data' })
  })

  // Access the Express server that Probot uses
  const expressApp = app.route()

  expressApp.get('/login', (req, res) => {
    const host = req.headers['x-forwarded-host'] || req.get('host')

    const params = querystring.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      redirect_uri: `https://${host}/login/cb`
    })

    const url = `https://github.com/login/oauth/authorize?${params}`
    res.redirect(url)
  })

  expressApp.get('/login/cb', async (req, res) => {
    const params = querystring.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code: req.query.code,
      state: req.query.state
    })

    // Complete OAuth dance
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      body: new URLSearchParams(params)
    })

    // TODO should we do something with the code?

    if (tokenRes.ok) {
      // Redirect after login
      res.redirect('https://github.com/apps/cardstack-test/installations/new')
    } else {
      res.status(500)
      res.send('Invalid code')
    }
  })
}
