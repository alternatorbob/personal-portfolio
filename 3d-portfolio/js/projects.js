export const projects = [
    {
        title: "Agora Installation",
        id: "Agora",
        description:
            "Interactive installation for L’Atelier Magazine, the annual publication of the EPFL Masters in Architecture. The installation generates a video stream procedurally using Touchdesigner. A QR code next to the work creates a remote on your phone browser.",
        year: "2023",
        categories: ["Installation", "Interaction", "Realtime"],

        content: {
            images: ["/projects/Agora_Installation/Agora_Cover.webp"],
            videos: [
                `<iframe src="https://player.vimeo.com/video/817961154?h=f82903df49&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen  title="Agora_Installation"></iframe><script src="https://player.vimeo.com/api/player.js"></script>`,
            ],
        },
    },
    {
        title: "ELPE Photography Museum",
        id: "ELPE",
        description:
            "ELPE is a visual identity project completed at ECAL under the supervision of the head of the Graphic Design department, Angelo Benedetto. I was tasked to develop a dynamic visual identity for a hypothetical art space. The concept takes the glass lens and utilises its refractive property as an optical typographical effect.",
        year: "2020",
        categories: ["graphic design", "art direction"],

        content: {
            images: [
                "/projects/ELPE/ELPE_1.webp",
                "/projects/ELPE/ELPE_2.webp",
                "/projects/ELPE/ELPE_3.webp",
                "/projects/ELPE/ELPE_4.webp",
                "/projects/ELPE/ELPE_5.webp",
            ],
            videos: [
                `<iframe src="https://player.vimeo.com/video/817958514?h=f6ecc372e3&badge=0&autopause=0&player_id=0&app_id=58479/embed" allow="autoplay; fullscreen; picture-in-picture" frameborder="0"></iframe>`,
                `<iframe src="https://player.vimeo.com/video/817963150?h=678fa60a83&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" title="ELPE Logo Generator Demo"></iframe><script src="https://player.vimeo.com/api/player.js"></script>`,
            ],
        },
    },
    {
        title: "Portfolio for Juri Roemmel",
        id: "Juri",
        description:
            "Personal portfolio website designed and programmed for Industrial Designer and ECAL Alumni Juri Roemmel.",
        year: "2021",
        categories: ["Web Design", "Web Development"],
        content: {
            images: [
                "/projects/Juri_Site/Juri_Cover.webp",
                "/projects/Juri_Site/Juri_Mockup.webp",
            ],
        },
    },
    {
        title: "MIDI Clock",
        id: "MIDI",
        description:
            "Made in collaboration with Industrial Designer Alex Sinh Nguyen, I worked on the MIDI Clock. Tasked to reimagine, the now considered obsolete object, we created an alarm clock that generates tomorrow’s alarm sound based on geographical data you record during the day. Map direction are translated into MIDI notes and different neighbourhoods unlock different sounds and instruments.",
        year: "2022",
        categories: ["Interaction", "Hardware + Software"],
        content: {
            images: [
                "/projects/MIDI_Clock/MIDI_Cover.webp",
                "/projects/MIDI_Clock/MIDI_2.webp",
                "/projects/MIDI_Clock/MIDI_3.webp",
                "/projects/MIDI_Clock/MIDI_4.webp",
                "/projects/MIDI_Clock/MIDI_5.webp",
            ],
            videos: [
                `<iframe src="https://player.vimeo.com/video/817949858?h=319cb0189d&badge=0&autopause=0&player_id=0&app_id=58479/embed" allow="autoplay; fullscreen; picture-in-picture" frameborder="0" ></iframe>`,
            ],
        },
    },
    {
        title: "Mindmaze Workshop",
        id: "Mindmaze",
        description:
            "Made in collaboration with Interaction Designer Nathanael Vianin, during a one week workshop with engineers from Mindmaze. We created a visualiser for EEG waves captured with a Unicorn headset.",
        year: "2022",
        categories: ["Creative Direction", "Unity Development"],
        content: {
            images: ["/projects/Mindmaze/Mindmaze_Cover.webp"],
            gifs: ["/projects/Mindmaze/mindmaze.gif"],
        },
    },
    {
        title: "Physical Sequencer",
        id: "Sequencer",
        description:
            "Made in collaboration with Interaction Designer Tickie Bindner, we created the Physical Sequencer. A device that generates sound based on the distance at which various objects are placed around it. Using a LiDar sensor for data, the device is a Teensy based synth with an onboard battery and speaker which freedom in exploring the sounds one can create with their environment",
        year: "2022",
        categories: ["Interaction", "CAD", "Hardware + Software"],
        content: {
            images: [
                "/projects/Physical_Sequencer/Sequencer_1.webp",
                "/projects/Physical_Sequencer/Sequencer_2.webp",
                "/projects/Physical_Sequencer/Sequencer_3.webp",
                "/projects/Physical_Sequencer/Sequencer_4.webp",
                "/projects/Physical_Sequencer/Sequencer_5.webp",
            ],
            videos: [
                `<iframe src="https://player.vimeo.com/video/816276332?h=3301081abb&badge=0&autopause=0&player_id=0&app_id=58479/embed" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen frameborder="0"></iframe>`,
            ],
        },
    },
    {
        title: "FULCRUM",
        id: "FULCRUM",
        description: `Targeted at the world of photojournalism, FULCRUM addresses privacy concerns surrounding the publication of photographs. 

        Whilst many photo-journalists would agree that blurring or censoring faces tampers with important historical documents, protecting sources is ultimately a core journalistic principle.
        
        Given today’s ubiquitous data scraping and face detection algorithms, legislation aimed at mitigating potential abuse, remains outpaced by the swift progress of technology. FULCRUM offers a contemporary solution to the ethical debate between photojournalists and the public.
        
        By masking subjects’ faces with AI generated ones, FULCRUM ensures non-destructive anonymisation, that simultaneously safeguards the identity of the individuals depicted, as well as the photographic quality of the image.
        `,

        year: "2023",
        categories: ["Interaction", "Web Development", "Machine Learning"],
        content: {
            images: [
                "/projects/FULCRUM/FULCRUM_1.webp",
                "/projects/FULCRUM/FULCRUM_2.webp",
                "/projects/FULCRUM/FULCRUM_3.webp",
                "/projects/FULCRUM/FULCRUM_4.webp",
            ],
        },
    },
    {
        title: "Physical Scrollbar",
        id: "Scroll",
        description:
            "Made in collaboration with Interaction Designer Tickie Bindner during a one week workshop with Yehwan Song. Tasked to create a project that explores the website and the mobile experiences’ relationship with the space, we made the connection between the scrollbar of a webpage and the handrail of a set of stairs. We made a phone case that attached to the handrail and transmitted data from a rotary encoder, via wifi, to the web page which would scroll in increments as the user went up the steps. Each step had its own section of the website thus creating a relationship between the physical and the digital.",
        year: "2022",
        categories: ["Interaction", "Hardware + Software", "Graphic Design"],
        content: {
            images: ["projects/Scroll/Scroll_Cover.webp"],
            videos: [
                `<iframe src="https://player.vimeo.com/video/817874024?h=a8e58f4072&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="Physical Scrollbar"></iframe>`,
            ],
        },
    },
    {
        title: "Self Tracking",
        id: "Self_Tracking",
        description:
            "My first ever website yay! Tasked to develop a website around data collected from my daily life as part of a semester project, being an avid cyclists, it quickly became evident what my source of data was going to be. I recorded rides through Strava, representing the GPS data in 3D alongside photographs I took on each outing.",
        year: "2020",
        categories: ["Web Design", "Web Development", "Photography"],
        content: {
            images: ["projects/Self_Tracking/Self_Tracking_Cover.webp"],
            videos: [
                `<iframe src="https://player.vimeo.com/video/396568264?h=a80c8cab1a&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479" frameborder="0" allow="autoplay; fullscreen; picture-in-picture"title="Self Tracking Click Through"></iframe><script src="https://player.vimeo.com/api/player.js"></script>`,
            ],
        },
    },
    {
        title: "Small World Big Possibilities",
        id: "Small_World",
        description:
            "For a semester course with Gilliane Cachin, I made a publication about microscopes and microphotography. I created a visual language which interprets graphical elements around the theme, in an attempt to explore their aesthetic potential. The “pseudo-scientific” visual research is laid out in this edition alongside spec sheets of cutting edge microscopes.",
        year: "2021",
        categories: ["Graphic Design", "Visual Research"],
        content: {
            images: [
                "/projects/Small_World/Small_1.webp",
                "/projects/Small_World/Small_2.webp",
                "/projects/Small_World/Small_3.webp",
                "/projects/Small_World/Small_4.webp",
                "/projects/Small_World/Small_5.webp",
                "/projects/Small_World/Small_6.webp",
                "/projects/Small_World/Small_7.webp",
                "/projects/Small_World/Small_8.webp",
                "/projects/Small_World/Small_9.webp",
                "/projects/Small_World/Small_10.webp",
                "/projects/Small_World/Small_11.webp",
                "/projects/Small_World/Small_12.webp",
                "/projects/Small_World/Small_13.webp",
            ],
        },
    },
    {
        title: "Stretching Time",
        id: "Stretching_Time",
        description: `Made in collaboration with Industrial Designers Denise Merlette, Giulia Burrus and Léa Omez, during a one week workshop on “Soft Electronics” with Claire Eliot. We created three timers that invoke the human perception of time. Each has an approximate interval, between 3-5 minutes, 10-15 or 30-45. 
        The objects leverage the elastic properties of the chosen materials. By sewing a pattern of conductive wire into the fabric, stretching the material varies the resistance the circuit can pick up, which in turn sets the timer.`,
        year: "2022",
        categories: ["Interaction", "Hardware + Software"],
        content: {
            images: [
                "/projects/Stretching_Time/Stretch_1.webp",
                "/projects/Stretching_Time/Stretch_2.webp",
                "/projects/Stretching_Time/Stretch_3.webp",
                "/projects/Stretching_Time/Stretch_4.webp",
                "/projects/Stretching_Time/Stretch_5.webp",
                "/projects/Stretching_Time/Stretch_6.webp",
                "/projects/Stretching_Time/Stretch_7.webp",
            ],
            videos: [
                `<iframe src="https://player.vimeo.com/video/817990658?h=1ad877a25b&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479" frameborder="0" allow="autoplay; fullscreen; picture-in-picture"title="Stretch_WIP_Short"></iframe><script src="https://player.vimeo.com/api/player.js"></script>`,
            ],
        },
    },
    {
        title: "Technologic",
        id: "Technologic",
        description:
            "Made in collaboration with Interaction Designer Viktor Gagné and Graphic Designer Sacha Décoppet during a one week workshop with Daniël Maarleveld. Tasked to design a black and white type based animation and an interactive poster based on the track “Technologic” from Daft Punk, I created an interactive poster featuring 3D physics enabled lettering.",
        year: "2023",
        categories: ["Interaction", "Web Development"],
        content: {
            images: ["/projects/Technologic/Technologic_Cover.webp"],
            videos: [
                `<iframe src="https://player.vimeo.com/video/817966215?h=c7585f138d&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479" frameborder="0" allow="autoplay; fullscreen; picture-in-picture"title="Technologic Workshop Interactive Poster"></iframe><script src="https://player.vimeo.com/api/player.js"></script>`,
            ],
        },
    },
    {
        title: "XYScpope",
        id: "XYScpope",
        description:
            "Made in collaboration with Interaction Designer Antoine Contreras during a one week workshop with Ted Davis. Using a p5.js library that enables vintage oscilloscope to reproduce digital canvases, we wanted to create a game, as a sort of hommage to the early days of computing powered by CRT displays. The inherent limited size at which images can be displayed, was leveraged by structuring the game around a small patch of the map. Furthermore we reward the user for trying to break the rules, this is a maze game which allows you to pass through the walls of the maze, however decreasing the frequency of the display at each pass, thus making it harder to see the map.",
        year: "2019",
        categories: ["Interaction", "Software"],
        content: {
            images: ["/projects/XYScope/XYScope_Cover.webp"],
            gifs: ["/projects/XYScope/XYScope.gif"],
        },
    },
    {
        title: "Zach Lieberman Workshop",
        id: "Zach_Workshop",
        description:
            "During a one week workshop with Zach Lieberman I got to learn how to use OpenFrameworks. Having long wanted to explore GLSL and shaders, I concentrated by week’s efforts on adding interaction to these realtime sketches themed around the circle.",
        year: "2019",
        categories: ["Creative Coding"],
        content: {
            images: ["/projects/Zach_Workshop/Zach_Cover.webp"],
            videos: [
                `<iframe src="https://player.vimeo.com/video/817987018?h=e42bfa3ddf&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="zach_lieberman_of_workshop_compilation"></iframe><script src="https://player.vimeo.com/api/player.js"></script>`,
            ],
        },
    },
];
