import os
import json

# --- CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
COMPONENTS_DIR = os.path.join(BASE_DIR, 'components')
OUTPUT_DIR = os.path.abspath(os.path.join(BASE_DIR, 'routes'))
TEMPLATE_PATH = os.path.abspath(os.path.join(BASE_DIR, 'route_template.html'))
# NOTE: Using a static JSON file for routes data in the absence of a direct API read function
JSON_PATH = os.path.join(BASE_DIR, 'assets', 'data', 'routes.json')


# ===============================================================================
# 1. HELPER FUNCTIONS: LOADING DATA & COMPONENTS
# ===============================================================================

def load_component(filename):
    """Loads a reusable HTML component from the components/ directory."""
    try:
        with open(os.path.join(COMPONENTS_DIR, filename), 'r', encoding='utf-8') as f:
            # Note: We replace relative asset paths for generated route pages (../assets/...)
            content = f.read()
            # For header/footer inserted into a sub-directory page (routes/page.html), 
            # we need to adjust asset paths
            content = content.replace('href="index.html"', 'href="../index.html"')
            content = content.replace('href="services.html"', 'href="../services.html"')
            content = content.replace('href="routes.html"', 'href="../routes.html"')
            content = content.replace('href="tariff.html"', 'href="../tariff.html"')
            content = content.replace('href="booking.html"', 'href="../booking.html"')
            content = content.replace('href="career.html"', 'href="../career.html"')
            content = content.replace('href="contact.html"', 'href="../contact.html"')
            content = content.replace('href="blog.html"', 'href="../blog.html"')
            content = content.replace('src="assets/images', 'src="../assets/images') # For logo/images
            content = content.replace('href="privacy-policy.html"', 'href="../privacy-policy.html"')
            content = content.replace('href="terms-of-service.html"', 'href="../terms-of-service.html"')
            return content
    except FileNotFoundError:
        print(f"\033[91mError: Component '{filename}' not found.\033[0m")
        return f"<!-- ERROR: {filename} NOT FOUND -->"

def load_routes_data():
    """Loads route data from the external JSON file."""
    try:
        with open(JSON_PATH, 'r', encoding='utf-8') as f:
            print(f"Reading data from {JSON_PATH}...")
            return json.load(f)
    except FileNotFoundError:
        print(f"\033[91mError: '{JSON_PATH}' not found. Please ensure the file exists.\033[0m")
        return None
    except json.JSONDecodeError:
        print(f"\033[91mError: Could not decode JSON. Please check for syntax errors in '{JSON_PATH}'.\033[0m")
        return None

# ===============================================================================
# 2. MAIN GENERATION LOGIC
# ===============================================================================

def generate_route_pages(routes_data):
    """
    Reads the template, loads components, and generates individual HTML pages.
    """
    
    # 1. Load Partials (Components)
    header_content = load_component('_header.html')
    mobile_nav_content = load_component('_mobile_nav.html')
    # Since the footer is complex, we assume it's also a partial
    footer_content = load_component('_footer.html') 

    # 2. Create the 'routes' directory
    try:
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        print(f"Directory '{OUTPUT_DIR}' is ready.")
    except OSError as e:
        print(f"Error creating directory {OUTPUT_DIR}: {e}")
        return

    # 3. Read the master HTML template
    try:
        with open(TEMPLATE_PATH, 'r', encoding='utf-8') as f:
            template_content = f.read()
        print(f"Successfully loaded {TEMPLATE_PATH}.")
    except FileNotFoundError:
        print(f"\033[91mError: '{TEMPLATE_PATH}' not found. Please create it first.\033[0m")
        return

    # 4. Inject Components into the Base Template (Pre-processing)
    # The route_template.html must be designed to accommodate these injections.
    # We'll use simple, unique placeholders for this.
    
    # NOTE: The route_template.html you submitted already links to the header/footer
    # using relative paths (../index.html, etc.), so we just need to ensure the HTML
    # content we use for the template is the fully assembled version or that the
    # template itself includes the partials via a placeholder. Since we don't have
    # the final route_template.html, we'll assume it has placeholders.
    
    # Let's create placeholders in the template for the content replacement:
    
    template_content = template_content.replace('<!-- HEADER CONTENT INJECTION -->', header_content)
    template_content = template_content.replace('<!-- MOBILE NAV CONTENT INJECTION -->', mobile_nav_content)
    template_content = template_content.replace('<!-- FOOTER CONTENT INJECTION -->', footer_content)

    # 5. Loop through each route and generate its page
    for route in routes_data:
        try:
            page_content = template_content

            # --- Process placeholders (as planned before) ---
            # ... (Existing logic for image_path_json, highlights_html, etc. goes here) ...

            # --- Final File Write ---
            origin_lower = route['origin'].lower().replace(' ', '-')
            destination_lower = route['destination'].lower().replace(' ', '-')
            filename = f"{origin_lower}-to-{destination_lower}.html"
            output_path = os.path.join(OUTPUT_DIR, filename)

            # Write the new HTML file
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(page_content)
            
            print(f"\033[92m✅ Successfully generated:\033[0m {output_path}")

        except Exception as e:
            print(f"\033[91m❌ Error processing '{route.get('origin', 'N/A')} to {route.get('destination', 'N/A')}': {e}\033[0m")

# --- Run the generator ---
if __name__ == "__main__":
    print("--- Starting Shrish Travels Route Page Generator ---")
    routes_data = load_routes_data()
    if routes_data:
        generate_route_pages(routes_data)
        print("\n\033[94m--- All route pages have been generated successfully! ---\033[0m")
    else:
        print("\n\033[91m--- Script finished with errors. No pages were generated. ---\033[0m")
