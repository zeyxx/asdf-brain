# GitHub Codespaces - Problèmes Critiques & Solutions

> **IMPORTANT**: Lire ce fichier à chaque début de session Codespaces

## 1. GIT PUSH VERS AUTRES REPOS (CRITIQUE)

### Symptôme
```
remote: Permission to owner/repo.git denied to user.
fatal: unable to access '...': The requested URL returned error: 403
```

### Cause
Le `GITHUB_TOKEN` du Codespace est scopé UNIQUEMENT au repo d'origine (ex: HolDex).

### Solution
```bash
unset GITHUB_TOKEN
git push https://$(gh auth token)@github.com/OWNER/REPO.git BRANCH
```

---

## 2. GITHUB MCP SERVER

### Symptôme
Les tools GitHub MCP (github@claude-plugins-official) ne fonctionnent pas ou retournent des erreurs d'auth.

### Solution
Utiliser `gh` CLI directement:
```bash
gh api repos/owner/repo           # API calls
gh pr create --title "..."        # Create PR
gh issue list                     # List issues
gh auth token                     # Get valid token
```

---

## 3. VARIABLES D'ENVIRONNEMENT

### Vérification
```bash
echo $GITHUB_TOKEN    # Token Codespace (limité)
gh auth token         # Token OAuth (complet avec 'repo' scope)
gh auth status        # Voir tous les tokens et scopes
```

### Règle
- `GITHUB_TOKEN` = Integration token, scopé au repo du Codespace SEULEMENT
- `gh auth token` = OAuth token personnel, scope 'repo' complet pour TOUS les repos

---

## 4. HOOKS CLAUDE CODE

### Config correcte (~/.claude/settings.json)
```json
{
  "hooks": {
    "SessionStart": [{
      "matcher": "",
      "hooks": [{
        "type": "command",
        "command": "node /path/script.js 2>/dev/null || true",
        "timeout": 10
      }]
    }]
  }
}
```

### Éviter
- Dupliquer les hooks dans settings.local.json (conflit)
- Oublier le timeout (peut bloquer le démarrage)
- Oublier `|| true` (peut bloquer si erreur)

---

## 5. CLAUDE-MEM DÉSACTIVÉ

### Problème
```
ENOENT: no such file or directory, open '/home/codespace/.claude/plugins/marketplaces/xxx/package.json'
```

### Solution
claude-mem est désactivé. Utiliser asdf-brain directement:
- `brain_learn` pour enregistrer des insights/decisions/patterns
- `brain_search` pour chercher
- `brain_context_*` pour le contexte de session

---

## 6. CREDENTIAL CACHE

### Reset complet si problèmes persistants
```bash
git credential reject << EOF
protocol=https
host=github.com
EOF
git config --global --unset credential.helper
```

---

## Checklist Début de Session

1. [ ] `gh auth status` - Vérifier authentification
2. [ ] Brain awakening s'affiche correctement
3. [ ] Si push vers autre repo nécessaire: `unset GITHUB_TOKEN` d'abord
4. [ ] Si MCP GitHub échoue: utiliser `gh` CLI
