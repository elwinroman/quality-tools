import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { MAX_FONT_SIZE, MIN_FONT_SIZE } from '@/enviroment/enviroment'
import { BearEditorOptionsState } from '@/models/zustand'

const initialState: Pick<
  BearEditorOptionsState,
  'fontSize' | 'renderWhitespace' | 'renderSideBySide' | 'theme' | 'minimap' | 'stickyScroll' | 'guides' | 'normalizeWhitespace'
> = {
  fontSize: 13,
  renderWhitespace: 'none',
  renderSideBySide: true,
  theme: 'oceanicnext',
  minimap: {
    enabled: true,
    side: 'right',
    renderCharacters: true,
    showSlider: 'mouseover',
  },
  stickyScroll: {
    enabled: false,
  },
  guides: {
    highlightActiveIndentation: true,
    indentation: false,
  },
  normalizeWhitespace: false,
}

export const useEditorOptionsStore = create<BearEditorOptionsState>()(
  persist(
    (set) => ({
      ...initialState,

      updateFontSize: (size) => {
        if (size >= MIN_FONT_SIZE && size <= MAX_FONT_SIZE) set({ fontSize: size })
      },
      updateRenderWhitespace: (value) => set({ renderWhitespace: value }),
      updateRenderSideBySide: (state) => set({ renderSideBySide: state }),
      updateTheme: (theme) => set({ theme }),
      updateMinimap: (state) =>
        set((prev) => ({
          minimap: {
            ...prev.minimap,
            enabled: state,
          },
        })),
      updateStickyScroll: (state) =>
        set((prev) => ({
          stickyScroll: {
            ...prev.stickyScroll,
            enabled: state,
          },
        })),
      updateGuides: (state) =>
        set((prev) => ({
          guides: {
            ...prev.guides,
            indentation: state,
          },
        })),
      updateNormalizeWhitespace: (state) => set({ normalizeWhitespace: state }),
      resetEditorOptions: () => set({ ...initialState }),
    }),
    {
      name: 'app.global.monacoeditor.options',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
