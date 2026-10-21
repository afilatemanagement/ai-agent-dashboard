<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Dashboard modules (Settings, Roles & Permissions, Security) read/write Cloud tables only through server functions in src/lib/admin.functions.ts; why: the app has no login by owner's choice, so the browser never touches tables directly and nothing shows fake data.
- Access control is a PIN per role (no accounts): the server signs a role token (ACCESS_TOKEN_SECRET), the browser sends it in the x-ayra-access header, and every protected server function calls requirePerm/requireSuperAdmin from src/lib/access.server.ts; why: the owner chose PINs over login, and toggles alone can't stop anyone.
- Home screen layout lives in src/components/AyraWorld.tsx (TopBar, AgentStage, BrowserPanel, ActivityPanel), styled by .ayra-world scoped tokens in styles.css; why: owner's reference design replaced the old banner, and the dark tokens must not leak to other screens.
