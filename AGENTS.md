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
