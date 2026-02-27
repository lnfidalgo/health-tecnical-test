# Agenda — Calendário de Eventos

Aplicação de agenda, desenvolvida em Next.js com visualização em mês, semana e dia. Permite criar, editar e excluir eventos com persistência local.

---

## Como rodar o projeto

### Pré-requisitos

- **Node.js** 18+ (recomendado LTS)
- **npm**, **yarn**, **pnpm** ou **bun**

### Passos

1. **Clone o repositório** (se ainda não tiver):
   ```bash
   git clone <url-do-repositorio>
   cd health-tecnical-test
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

4. Abra [http://localhost:3000](http://localhost:3000) no navegador.

Para gerar uma build de produção e rodar em modo produção:

```bash
npm run build
npm start
```

---

## Organização do projeto

A estrutura foi pensada para ser clara e fácil de navegar:

```
src/
├── app/                    # App Router do Next.js
│   ├── layout.tsx          # Layout raiz (fontes, tema, Toaster)
│   ├── page.tsx            # Página principal do calendário
│   └── globals.css         # Estilos globais
│
├── components/
│   ├── calendar/           # Componentes específicos do calendário
│   │   ├── CreateEventDialog.tsx   # Modal de criar evento
│   │   ├── EditEventDialog.tsx     # Modal de editar evento
│   │   ├── EventDetailModal.tsx    # Detalhes do evento
│   │   ├── DayDetailModal.tsx      # Lista de eventos do dia
│   │   ├── DayTimeline.tsx         # Timeline da visão “dia”
│   │   ├── EventCard.tsx           # Card de evento nas grids
│   │   ├── EventForm.tsx           # Formulário compartilhado (criar/editar)
│   │   ├── MonthGrid.tsx           # Grade da visão “mês”
│   │   ├── WeekGrid.tsx            # Grade da visão “semana”
│   │   ├── MobileEventsList.tsx    # Lista de eventos no mobile
│   │   └── types.ts                # Tipos do domínio (CalendarEvent, etc.)
│   │
│   └── ui/                 # Componentes de interface reutilizáveis (shadcn/ui)
│       ├── button.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── select.tsx
│       └── ...
│
├── store/
│   └── useEventsStore.ts   # Estado global dos eventos (Zustand + persist)
│
├── utils/
│   ├── time.ts             # Helpers de data/hora (dayKey, formatação)
│   ├── eventColors.ts      # Cores por tipo de evento
│   └── cnUtils.ts          # Utilitário de classes (Tailwind)
│
└── providers/
    └── theme-provider.tsx  # Provedor de tema (claro/escuro)
```

- **`app/`**: rotas e layout; a página principal orquestra as views (mês/semana/dia) e os modais.
- **`components/calendar/`**: toda a lógica de UI do calendário (grids, modais, formulário, tipos).
- **`components/ui/`**: primitivos de UI (botões, inputs, dialogs, etc.) para manter consistência.
- **`store/`**: um único store Zustand para eventos, com persistência em `localStorage`.
- **`utils/`**: funções puras de data, cores e CSS.
- **`providers/`**: contexto de tema usado no layout.

---

## Simplicidade da construção

- **Uma página principal** (`app/page.tsx`): concentra o estado da view (mês/semana/dia), data selecionada e abertura dos modais. Os componentes de calendário recebem apenas props e callbacks.
- **Um store de eventos** (`useEventsStore`): lista de eventos, funções para adicionar, editar e remover, e helpers por dia (`eventsByDayKey`, `eventsTouchingDayKey`). Persistência feita com middleware `persist` do Zustand.
- **Formulário único** (`EventForm.tsx`): reutilizado nos modais de criar e editar, com validação via **React Hook Form** e **Zod**.
- **Design system enxuto**: componentes em `components/ui` (baseados em Radix + Tailwind) garantem aparência e acessibilidade consistentes sem duplicar código.
- **Sem backend**: os dados ficam no `localStorage`; a aplicação é estática do ponto de vista de servidor, o que facilita deploy e testes.

## Imagens do projeto
<img width="1122" height="888" alt="image" src="https://github.com/user-attachments/assets/4c4898a7-7ea8-4730-bb79-d1a3d3bd8021" />
<img width="1112" height="883" alt="image" src="https://github.com/user-attachments/assets/ec3c0274-38a9-4ebc-82c4-170e0182d9a1" />
<img width="1108" height="881" alt="image" src="https://github.com/user-attachments/assets/554f4c76-c3b0-4eff-b8fc-838e29a43182" />
<img width="585" height="469" alt="image" src="https://github.com/user-attachments/assets/9cc41cd9-86fa-4b89-9dbc-b728ea60f37a" />
<img width="514" height="592" alt="image" src="https://github.com/user-attachments/assets/3fd50014-c341-4a87-ae2b-08f58fc0bb89" />
<img width="496" height="587" alt="image" src="https://github.com/user-attachments/assets/9649cd01-fe7d-428a-b00a-b7640a660791" />





