# Chrome Web Store Publishing

This guide covers the steps required to publish Tab Manager in the Chrome Web Store.

## Developer Account

1. Open the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole).
2. Register as a Chrome Web Store developer.
3. Agree to the developer terms and pay the one-time registration fee.
4. Enable [2-Step Verification](https://myaccount.google.com/security/signinoptions/two-step-verification/enroll-welcome).
5. Set a publisher name.
6. Verify the developer contact email address.

### Email Recommendation

Google recommends using a separate email address for Chrome Web Store publishing. This is a recommendation, not a separate technical requirement.

A dedicated account or alias is useful because:

- Google sends publishing, review, policy, and security notices to this address.
- The developer account email cannot simply be changed after account creation.
- Ownership and recovery are easier to manage when the publishing account is explicit.
- The account can remain separate from a personal or day-to-day work inbox.

The address should be checked regularly, protected with 2-Step Verification, and have recovery options configured. Do not use an address that may be lost when a job, school account, or temporary project ends.

## Extension Package

Before uploading:

- Test the unpacked extension in Chrome.
- Confirm that `manifest.json` is valid and is at the root of the ZIP file.
- Confirm the manifest has a release version higher than any previously published version.
- Confirm the manifest name, description, icons, permissions, and service worker are final.
- Include the runtime extension files and required `_locales/` and `assets/` directories.
- Do not include development-only files unless they are required by the extension at runtime.

Google's [Prepare your extension](https://developer.chrome.com/docs/webstore/prepare) guide describes the package requirements.

## Store Listing

The Developer Dashboard requires listing information such as:

- Name and detailed description
- Category and language
- At least one store screenshot
- 128x128 store icon
- 440x280 promotional tile
- Optional additional screenshots, promotional video, homepage, and support URL

See [Complete your listing information](https://developer.chrome.com/docs/webstore/cws-dashboard-listing) and [Supplying Images](https://developer.chrome.com/docs/webstore/images).

## Privacy and Permissions

Complete the Privacy section with accurate information about:

- The extension's single purpose
- Why each manifest permission is required
- Whether the extension uses remote code
- What user data is collected or stored
- How that data is used
- The privacy policy URL

The answers must match the extension's real behavior. See [Fill out the privacy fields](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy) and the [Chrome Web Store program policies](https://developer.chrome.com/docs/webstore/program-policies).

## Distribution and Review

Choose the distribution settings:

- Free or paid
- Public, private, or trusted testers
- Geographic availability
- Immediate or deferred publishing after review

Then upload the ZIP, complete the listing, submit it for review, and publish after approval. See [Publish in the Chrome Web Store](https://developer.chrome.com/docs/webstore/publish).

## Repository Readiness

Before the first submission, complete or explicitly defer:

- Automated tests and Chrome manual validation
- Store screenshots and promotional tile
- Privacy policy and dashboard privacy declarations
- Release version decision
- Release ZIP creation
- Commit and push of the release changes
