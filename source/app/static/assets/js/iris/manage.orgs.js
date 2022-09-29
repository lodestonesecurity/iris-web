var modal_org_table;
var current_orgs_list;
var current_org_cases_access_list;
manage_orgs_table = $('#org_table').dataTable( {
    "order": [[ 1, "asc" ]],
    "autoWidth": false,
    "columns": [
        {
            "data": "org_id",
            "render": function ( data, type, row ) {
                if (type === 'display') {
                    data = sanitizeHTML(data)
                    return '<a href="#" onclick="org_detail(\'' + row["org_id"] + '\');">' + data +'</a>';
                }
                return data;
            }
        },
        { "data": "org_name",
          "render": function ( data, type, row ) {
                if (type === 'display') {
                    data = sanitizeHTML(data)
                    return '<a href="#" onclick="org_detail(\'' + row["org_id"] + '\');">' + data +'</a>';
                }
                return data;
            }
        },
        { "data": "org_description",
          "render": function (data, type, row, meta) {
            if (type === 'display') { data = sanitizeHTML(data);}
            return data;
          }
        },
        { "data": "org_nationality",
          "render": function (data, type, row, meta) {
                if (type === 'display') {
                    data = sanitizeHTML(data);
                }
                return data;
              }
        },
        { "data": "org_sector",
            "render": function ( data, type, row ) {
                if (type === 'display') {
                    data = sanitizeHTML(data);
                }
                return data;
            }
        }
      ]
    }
);

function refresh_organisations(do_notify) {

    get_request_api('organisations/list')
    .done((data) => {
        if(notify_auto_api(data, true)) {
            current_orgs_list = data.data;
            manage_orgs_table.api().clear().rows.add(data.data).draw();

            if (do_notify !== undefined) {
                notify_success("Refreshed");
            }

        }

    });

}

function org_detail(org_id) {
    url = 'organisations/' + org_id + '/modal' + case_param();
    $('#modal_access_control').load(url, function (response, status, xhr) {
        if (status !== "success") {
             ajax_notify_error(xhr, url);
             return false;
        }

        $('#submit_new_org').on("click", function () {
            clear_api_error();

            var data_sent = $('#form_new_org').serializeObject();
            post_request_api('/manage/organisations/update/' + org_id, JSON.stringify(data_sent))
            .done((data) => {
                if(notify_auto_api(data)) {
                    refresh_organisations();
                    $('#modal_access_control').modal('hide');
                }
            });

            return false;
        })


    });
    $('#modal_access_control').modal({ show: true });
}

function add_organisation() {
    url = '/manage/organisations/add/modal' + case_param();
    $('#modal_access_control').load(url, function (response, status, xhr) {
        if (status !== "success") {
             ajax_notify_error(xhr, url);
             return false;
        }

        $('#submit_new_org').on("click", function () {
             clear_api_error();
            var data_sent = $('#form_new_org').serializeObject();
            post_request_api('/manage/organisations/add', JSON.stringify(data_sent))
            .done((data) => {
                if(notify_auto_api(data)) {
                    refresh_organisations();
                    $('#modal_access_control').modal('hide');
                }
            });
        });
        $('#modal_access_control').modal({ show: true });
    });
}

function delete_org(org_id) {

    swal({
      title: "Are you sure?",
      text: "You won't be able to revert this !",
      icon: "warning",
      buttons: true,
      dangerMode: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    })
    .then((willDelete) => {
      if (willDelete) {
        get_request_api('/manage/organisations/delete/' + org_id)
        .done((data) => {
            if(notify_auto_api(data)) {
                refresh_organisations();
                $('#modal_access_control').modal('hide');
            } else {
                window.swal({
                  title: "Cannot delete organisation",
                  text: data.data,
                  button: true,
                  allowOutsideClick: false
            });
            }
        });
      } else {
        swal("Pfew, that was close");
      }
    });
}

function remove_members_from_org(org_id, user_id, on_finish) {

    swal({
      title: "Are you sure?",
      text: "This will remove the user from the organisation",
      icon: "warning",
      buttons: true,
      dangerMode: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, remove it!'
    })
    .then((willDelete) => {
        if (willDelete) {
            url = '/manage/organisations/' + org_id + '/members/delete/' + user_id;

            get_request_api(url)
            .done((data) => {
                if(notify_auto_api(data)) {
                    refresh_organisations();
                    refresh_organisation_members(org_id);

                    if (on_finish !== undefined) {
                        on_finish();
                    }

                }
            });
        }
    });

}

function manage_organisation_members(org_id) {
    url = 'organisations/' + org_id + '/members/modal' + case_param();

    $('#manage_org_members_button').text('Loading manager...');

    $('#modal_ac_additional').load(url, function (response, status, xhr) {
        if (status !== "success") {
             ajax_notify_error(xhr, url);
             $('#manage_org_members_button').text('Manage');
             return false;
        }

        $('#manage_org_members_button').text('Manage');
        $('#save_org_members').on("click", function () {
            clear_api_error();

            var data_sent = Object();
            data_sent['org_members'] = $('#org_members').val();
            data_sent['csrf_token'] = $('#csrf_token').val();
            window.swal({
                  title: "Updating access",
                  text: "Please wait. We are updating users access.",
                  icon: "/static/assets/img/loader_cubes.gif",
                  button: false,
                  allowOutsideClick: false
            });

            post_request_api('organisations/' + org_id + '/members/update', JSON.stringify(data_sent))
            .done((data) => {
                if(notify_auto_api(data)) {
                    refresh_organisations();
                    refresh_organisation_members(org_id);
                    $('#modal_ac_additional').modal('hide');
                }
            })
            .always(() => {
                window.swal.close();
            });

            return false;
        });
        $('#modal_ac_additional').modal({ show: true });
    });
}

function refresh_organisation_members(org_id) {
    if (modal_org_table !== undefined) {
        get_request_api('/manage/organisations/' + org_id)
        .done((data) => {
            if(notify_auto_api(data)) {
                modal_org_table.clear();
                modal_org_table.rows.add(data.data.org_members).draw();
            }
        });
    }
}

function refresh_organisation_cac(org_id) {
    if (modal_org_cac !== undefined) {
        get_request_api('/manage/organisations/' + org_id)
        .done((data) => {
            if(notify_auto_api(data)) {
                current_org_cases_access_list = data.data.org_cases_access;
                modal_org_cac.clear();
                modal_org_cac.rows.add(current_org_cases_access_list).draw();
            }
        });
    }
}

function manage_organisation_cac(org_id) {
    url = 'organisations/' + org_id + '/cases-access/modal' + case_param();

    $('#manage_org_cac_button').text('Loading manager...');

    $('#modal_ac_additional').load(url, function (response, status, xhr) {
        $('#manage_org_cac_button').text('Set case access');
        if (status !== "success") {
             ajax_notify_error(xhr, url);
             return false;
        }

        $('#grant_case_access_to_org').on("click", function () {
            clear_api_error();

            var data_sent = Object();
            data_sent['access_level'] = parseInt($('#org_case_ac_select').val());
            data_sent['cases_list'] = $('#org_case_access_select').val();

            data_sent['csrf_token'] = $('#csrf_token').val();
            window.swal({
                  title: "Updating access",
                  text: "Please wait. We are updating users access.",
                  icon: "/static/assets/img/loader_cubes.gif",
                  button: false,
                  allowOutsideClick: false
            });
            post_request_api('organisations/' + org_id + '/cases-access/add', JSON.stringify(data_sent))
            .done((data) => {
                if(notify_auto_api(data)) {
                    refresh_organisations();
                    refresh_organisation_cac(org_id);
                    $('#modal_ac_additional').modal('hide');
                }
            })
            .always(() => {
                window.swal.close();
            });

            return false;
        });
        $('#modal_ac_additional').modal({ show: true });
    });
}

function remove_case_access_from_org(group_id, case_id, on_finish) {
     remove_cases_access(group_id, [case_id], on_finish);
}

function remove_cases_access_from_table(org_id, rows) {
    cases = [];
    for (cid in rows) {
        cases.push(rows[cid].case_id);
    }
    remove_cases_access(org_id, cases);
}

function remove_cases_access(org_id, cases, on_finish) {

    swal({
      title: "Are you sure?",
      text: "Members of this organisation might not be able to access these case(s) anymore",
      icon: "warning",
      buttons: true,
      dangerMode: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, remove them!'
    })
    .then((willDelete) => {
        if (willDelete) {
            url = '/manage/organisations/' + org_id + '/cases-access/delete';
            window.swal({
                  title: "Updating access",
                  text: "Please wait. We are updating users permissions.",
                  icon: "/static/assets/img/loader_cubes.gif",
                  button: false,
                  allowOutsideClick: false
            });

            var data_sent = Object();
            data_sent['cases'] = cases;
            data_sent['csrf_token'] = $('#csrf_token').val();

            post_request_api(url, JSON.stringify(data_sent))
            .done((data) => {
                if(notify_auto_api(data)) {
                    refresh_organisations();
                    refresh_organisation_cac(org_id);

                    if (on_finish !== undefined) {
                        on_finish();
                    }
                    window.swal.close();
                }
            });
        }
    });

}


$(document).ready(function () {
    refresh_organisations();
});