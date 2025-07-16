// gitprofile.config.ts

const CONFIG = {
  github: {
    username: 'ryanhulke', // Your GitHub org/user name. (This is the only required config)
  },
  /**
   * If you are deploying to https://<USERNAME>.github.io/, for example your repository is at https://github.com/arifszn/arifszn.github.io, set base to '/'.
   * If you are deploying to https://<USERNAME>.github.io/<REPO_NAME>/,
   * for example your repository is at https://github.com/arifszn/portfolio, then set base to '/portfolio/'.
   */
  base: '/',
  projects: {
    github: {
      display: true, // Display GitHub projects?
      header: 'Github Projects',
      mode: 'automatic', // Mode can be: 'automatic' or 'manual'
      automatic: {
        sortBy: 'updated', // Sort projects by 'stars' or 'updated'
        limit: 8, // How many projects to display.
        exclude: {
          forks: false, // Forked projects will not be displayed if set to true.
          projects: [
            'ryanhulke/AVL',
            'ryanhulke/LL',
            'ryanhulke/ryanhulke.github.io',
          ], // These projects will not be displayed. example: ['arifszn/my-project1', 'arifszn/my-project2']
        },
      },
      manual: {
        // Properties for manually specifying projects
        projects: ['ryanhulke/searchless-chess'], // List of repository names to display. example: ['arifszn/my-project1', 'arifszn/my-project2']
      },
    },
    external: {
      /*
      header: 'My Projects',
      // To hide the `External Projects` section, keep it empty.
      projects: [
        {
          title: 'Project Name',
          description:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nunc ut.',
          imageUrl:
            'https://img.freepik.com/free-vector/illustration-gallery-icon_53876-27002.jpg',
          link: 'https://example.com',
        },
        {
          title: 'Project Name',
          description:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nunc ut.',
          imageUrl:
            'https://img.freepik.com/free-vector/illustration-gallery-icon_53876-27002.jpg',
          link: 'https://example.com',
        },
      ],
      */
    },
  },
  seo: {
    title: 'Portfolio of Ryan Hulke',
    description: '',
    imageURL: '',
  },
  social: {
    linkedin: 'ryanhulke',
    twitter: 'ryanhulke_',
    mastodon: '',
    facebook: '',
    instagram: '',
    youtube: '', // example: 'pewdiepie'
    dribbble: '',
    behance: '',
    medium: '',
    dev: '',
    stackoverflow: '', // example: '1/jeff-atwood'
    skype: '',
    telegram: '',
    website: '',
    phone: '',
    email: 'rshulke@hotmail.com',
  },
  resume: {
    fileUrl: '', // Empty fileUrl will hide the `Download Resume` button.
  },
  skills: [
    'Python',
    'PyTorch',
    'C',
    'C++',
    'Java',
    'JavaScript',
    'Node.js',
    'Git',
    'HTML',
  ],
  experiences: [
    {
      company: 'Arthrex',
      position: 'Digital Research Intern',
      from: 'May 2025',
      to: 'August 2025',
      companyLink: 'https://arthrex.com',
    },
    {
      company: 'Dias Lab - University of Florida',
      position: 'Machine Learning Research Assistant',
      from: 'September 2024',
      to: 'Present',
      companyLink: 'https://ufl.edu',
    },
    {
      company: 'Florida Blue',
      position: 'IT Intern | Generative AI',
      from: 'May 2024',
      to: 'August 2024',
      companyLink: 'https://floridablue.com',
    },
  ],
  certifications: [],
  educations: [
    {
      institution: 'University of Florida',
      degree: 'B.S. Computer Science, Minor in Physics',
      from: '2022',
      to: '2026',
    },
  ],
  // Display articles from your medium or dev account. (Optional)
  blog: {
    /*
    source: 'dev', // medium | dev
    username: 'arifszn', // to hide blog section, keep it empty
    limit: 3, // How many articles to display. Max is 10.
    */
  },
  googleAnalytics: {
    id: '', // GA3 tracking id/GA4 tag id UA-XXXXXXXXX-X | G-XXXXXXXXXX
  },
  // Track visitor interaction and behavior. https://www.hotjar.com
  hotjar: {
    id: '',
    snippetVersion: 6,
  },
  themeConfig: {
    // Hides the switch in the navbar
    // Useful if you want to support a single color mode
    disableSwitch: true,

    // Should use the prefers-color-scheme media-query,
    // using user system preferences, instead of the hardcoded defaultTheme
    respectPrefersColorScheme: false,

    // Display the ring in Profile picture
    displayAvatarRing: true,

    // Set default theme to use your custom theme
    defaultTheme: 'procyon',

    // Available themes. To remove any theme, exclude from here.
    themes: [
      'light',
      'dark',
      'cupcake',
      'bumblebee',
      'emerald',
      'corporate',
      'synthwave',
      'retro',
      'cyberpunk',
      'valentine',
      'halloween',
      'garden',
      'forest',
      'aqua',
      'lofi',
      'pastel',
      'fantasy',
      'wireframe',
      'black',
      'luxury',
      'dracula',
      'cmyk',
      'autumn',
      'business',
      'acid',
      'lemonade',
      'night',
      'coffee',
      'winter',
      'dim',
      'nord',
      'sunset',
      'procyon',
    ],

    // Custom theme, applied to `procyon` theme
    customTheme: {
      primary: '#7ecbff', // baby blue
      secondary: '#303030', // dark grey for main components
      accent: '#7ecbff', // baby blue accent
      neutral: '#202020', // darker grey background
      'base-100': '#1A1A1A', // dark grey for cards/components
      'base-200': '#101010', // darker grey for deeper elements
      'base-300': '#252525', // lighter grey for borders
      'base-content': '#ffffff', // white text
      '--rounded-box': '3rem',
      '--rounded-btn': '3rem',
    },
  },

  // Optional Footer. Supports plain text or HTML.
  footer: ``,

  enablePWA: true,
};

export default CONFIG;
