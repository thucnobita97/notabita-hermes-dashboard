# Project Skills

This directory contains project-specific skills following the [agentskills.io](https://agentskills.io) layout.

## Structure

```
skills/
└── <skill-name>/
    ├── SKILL.md          # Skill definition (YAML frontmatter + markdown)
    └── references/       # Supporting files (API docs, templates, etc.)
```

## Current skills

No skills defined yet. Skills will be added as recurring workflows emerge:

- **build-workflow** (planned): Build process, environment setup, common issues
- **deploy-workflow** (planned): Deployment steps, rollback procedures
- **testing-guide** (planned): Test strategy, API mocking patterns

## Guidelines

- Skills are 100% English (artifact rule)
- Only create skills for genuinely recurring workflows
- Link to upstream docs instead of duplicating information
- Update skills when workflows change (via git)

## References

- Hermes rule 6 (SOUL.md): Project skills must live in repo, not `~/.hermes/skills/`
- Skill format: YAML frontmatter + markdown body
- Verification: `skills_list` after authoring to confirm visibility
